import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { globalAuditLogs } from "../../audit-logs/route";
import { evaluateRules } from "../../../lib/alertRules";
import { addAlert } from "../../../lib/alertStore";
import type { AuditEvent } from "../../../lib/auditTypes";

const WEBHOOK_SECRET = process.env.ASGARDEO_WEBHOOK_SECRET || "";

// Verify the HMAC-SHA256 signature Asgardeo sends in x-hub-signature-256
function verifySignature(rawBody: string, signatureHeader: string): boolean {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === "your-webhook-secret-here") {
    console.warn("[Webhook] ASGARDEO_WEBHOOK_SECRET not set — skipping signature check");
    return true; // allow through in dev until the secret is configured
  }

  const expected = `sha256=${createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

// Map Asgardeo event types to our internal AuditEvent format
function mapAsgardeoEvent(payload: AsgardeoWebhookPayload): AuditEvent | null {
  const { event } = payload;
  if (!event) return null;

  const actor =
    event.initiator?.claims?.["http://wso2.org/claims/username"] ||
    event.initiator?.claims?.["http://wso2.org/claims/emailaddress"] ||
    event.initiator?.ref ||
    "unknown";

  const ip = event.context?.remoteAddress || "unknown";
  const userAgent = event.context?.userAgent || "Asgardeo";
  const ts = new Date(event.timestamp || Date.now()).toISOString();
  const id = `asgardeo_${event.ref || Date.now()}`;

  // Login failure
  if (
    event.type?.includes("login.failure") ||
    event.type?.includes("authentication.fail")
  ) {
    return {
      id,
      timestamp: ts,
      type: "auth",
      severity: "warning",
      action: "user.login.failed",
      actor,
      ip,
      userAgent,
      details: `Login failed for ${actor}. Reason: ${event.context?.failureReason || "invalid credentials"}.`,
    };
  }

  // Login success
  if (
    event.type?.includes("login.success") ||
    event.type?.includes("authentication.success")
  ) {
    return {
      id,
      timestamp: ts,
      type: "auth",
      severity: "info",
      action: "user.login.success",
      actor,
      ip,
      userAgent,
      details: `${actor} authenticated successfully via Asgardeo.`,
    };
  }

  // User deleted
  if (event.type?.includes("user.delete") || event.type?.includes("USER_DELETE")) {
    const deletedUser =
      event.subject?.claims?.["http://wso2.org/claims/username"] ||
      event.subject?.ref ||
      "unknown user";
    return {
      id,
      timestamp: ts,
      type: "admin",
      severity: "critical",
      action: "user.deleted",
      actor,
      ip,
      userAgent,
      details: `User ${deletedUser} was permanently deleted by ${actor}.`,
    };
  }

  // Role / group update
  if (
    event.type?.includes("role.update") ||
    event.type?.includes("group.update") ||
    event.type?.includes("ROLE_UPDATE")
  ) {
    const target =
      event.subject?.claims?.["http://wso2.org/claims/username"] ||
      event.subject?.ref ||
      "unknown user";
    const newRole = event.context?.role || "unknown role";
    return {
      id,
      timestamp: ts,
      type: "admin",
      severity: "warning",
      action: "user.role.updated",
      actor,
      ip,
      userAgent,
      details: `${actor} updated role of ${target} to ${newRole}.`,
    };
  }

  // User created / registered
  if (event.type?.includes("user.create") || event.type?.includes("REGISTRATION")) {
    const newUser =
      event.subject?.claims?.["http://wso2.org/claims/username"] ||
      event.subject?.ref ||
      "new user";
    return {
      id,
      timestamp: ts,
      type: "admin",
      severity: "info",
      action: "user.created",
      actor,
      ip,
      userAgent,
      details: `New user ${newUser} was provisioned in Asgardeo.`,
    };
  }

  // Password update
  if (event.type?.includes("password.update") || event.type?.includes("PASSWORD_UPDATE")) {
    return {
      id,
      timestamp: ts,
      type: "security",
      severity: "warning",
      action: "user.password.changed",
      actor,
      ip,
      userAgent,
      details: `${actor} changed their password.`,
    };
  }

  // Unknown event — log it as system info so nothing is silently dropped
  return {
    id,
    timestamp: ts,
    type: "system",
    severity: "info",
    action: `asgardeo.${event.type || "unknown"}`,
    actor,
    ip,
    userAgent,
    details: `Unrecognised Asgardeo event: ${event.type}`,
  };
}

// Asgardeo webhook payload shape (based on Asgardeo docs)
interface AsgardeoWebhookPayload {
  ref?: string;
  organizationName?: string;
  event?: {
    ref?: string;
    type?: string;
    timestamp?: number;
    initiator?: {
      ref?: string;
      type?: string;
      claims?: Record<string, string>;
    };
    subject?: {
      ref?: string;
      type?: string;
      claims?: Record<string, string>;
    };
    context?: {
      remoteAddress?: string;
      userAgent?: string;
      failureReason?: string;
      role?: string;
      [key: string]: unknown;
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";

  if (!verifySignature(rawBody, signature)) {
    console.warn("[Webhook] Signature mismatch — request rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: AsgardeoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(`[Webhook] Received event: ${payload.event?.type} from org: ${payload.organizationName}`);

  const auditEvent = mapAsgardeoEvent(payload);
  if (!auditEvent) {
    return NextResponse.json({ status: "ignored", reason: "no event field in payload" });
  }

  // push to audit log store + run alert rules
  globalAuditLogs.push(auditEvent);
  const triggered = evaluateRules(auditEvent, globalAuditLogs);
  triggered.forEach(addAlert);

  return NextResponse.json({
    status: "ok",
    eventProcessed: auditEvent.action,
    alertsTriggered: triggered.length,
  });
}
