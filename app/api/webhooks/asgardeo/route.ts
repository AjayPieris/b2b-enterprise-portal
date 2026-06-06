import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { globalAuditLogs } from "../../audit-logs/route";
import { evaluateRules } from "../../../lib/alertRules";
import { addAlert } from "../../../lib/alertStore";
import type { AuditEvent } from "../../../lib/auditTypes";

const WEBHOOK_SECRET = process.env.ASGARDEO_WEBHOOK_SECRET || "";

function verifySignature(rawBody: string, signatureHeader: string): boolean {
  if (!WEBHOOK_SECRET || WEBHOOK_SECRET === "your-webhook-secret-here") {
    console.warn("[Webhook] ASGARDEO_WEBHOOK_SECRET not set — skipping signature check");
    return true;
  }

  const expectedSignature = `sha256=${createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

// Safely extract a user identifier from an event entity (initiator or subject)
const extractUser = (entity?: any, fallback = "unknown") => 
  entity?.claims?.["http://wso2.org/claims/username"] ||
  entity?.claims?.["http://wso2.org/claims/emailaddress"] ||
  entity?.ref ||
  fallback;

function mapAsgardeoEvent(payload: AsgardeoWebhookPayload): AuditEvent | null {
  const { event } = payload;
  if (!event) return null;

  const actor = extractUser(event.initiator, "unknown");
  const ip = event.context?.remoteAddress || "unknown";
  const userAgent = event.context?.userAgent || "Asgardeo";
  const timestamp = new Date(event.timestamp || Date.now()).toISOString();
  const id = `asgardeo_${event.ref || Date.now()}`;
  const eventType = event.type || "";

  // Helper to DRY up the event creation logic
  const createEvent = (
    type: AuditEvent["type"], 
    severity: AuditEvent["severity"], 
    action: string, 
    details: string
  ): AuditEvent => ({
    id, timestamp, type, severity, action, actor, ip, userAgent, details
  });

  if (eventType.includes("login.failure") || eventType.includes("authentication.fail")) {
    const reason = event.context?.failureReason || "invalid credentials";
    return createEvent("auth", "warning", "user.login.failed", `Login failed for ${actor}. Reason: ${reason}.`);
  }

  if (eventType.includes("login.success") || eventType.includes("authentication.success")) {
    return createEvent("auth", "info", "user.login.success", `${actor} authenticated successfully via Asgardeo.`);
  }

  if (eventType.includes("user.delete") || eventType.includes("USER_DELETE")) {
    const targetUser = extractUser(event.subject, "unknown user");
    return createEvent("admin", "critical", "user.deleted", `User ${targetUser} was permanently deleted by ${actor}.`);
  }

  if (eventType.includes("role.update") || eventType.includes("group.update") || eventType.includes("ROLE_UPDATE")) {
    const targetUser = extractUser(event.subject, "unknown user");
    const newRole = event.context?.role || "unknown role";
    return createEvent("admin", "warning", "user.role.updated", `${actor} updated role of ${targetUser} to ${newRole}.`);
  }

  if (eventType.includes("user.create") || eventType.includes("REGISTRATION")) {
    const newUser = extractUser(event.subject, "new user");
    return createEvent("admin", "info", "user.created", `New user ${newUser} was provisioned in Asgardeo.`);
  }

  if (eventType.includes("password.update") || eventType.includes("PASSWORD_UPDATE")) {
    return createEvent("security", "warning", "user.password.changed", `${actor} changed their password.`);
  }

  // Fallback for unhandled event types
  return createEvent("system", "info", `asgardeo.${eventType || "unknown"}`, `Unrecognised Asgardeo event: ${eventType}`);
}

interface AsgardeoWebhookPayload {
  ref?: string;
  organizationName?: string;
  event?: {
    ref?: string;
    type?: string;
    timestamp?: number;
    initiator?: any;
    subject?: any;
    context?: {
      remoteAddress?: string;
      userAgent?: string;
      failureReason?: string;
      role?: string;
      [key: string]: unknown;
    };
  };
}

// Receive messages (webhooks) from the Identity Provider
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";

  if (!verifySignature(rawBody, signature)) {
    console.warn("[Webhook] Signature mismatch — request rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload: AsgardeoWebhookPayload = JSON.parse(rawBody);
    console.log(`[Webhook] Received event: ${payload.event?.type} from org: ${payload.organizationName}`);

    const auditEvent = mapAsgardeoEvent(payload);
    if (!auditEvent) {
      return NextResponse.json({ status: "ignored", reason: "no event field in payload" });
    }

    globalAuditLogs.push(auditEvent);
    
    // Evaluate alert rules based on the new event
    const triggered = evaluateRules(auditEvent, globalAuditLogs);
    triggered.forEach(addAlert);

    return NextResponse.json({
      status: "ok",
      eventProcessed: auditEvent.action,
      alertsTriggered: triggered.length,
    });
    
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }
}
