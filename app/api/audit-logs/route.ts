import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";

interface AuditEvent {
  id: string;
  timestamp: string;
  type: "auth" | "admin" | "system" | "security";
  severity: "info" | "warning" | "critical";
  action: string;
  actor: string;
  ip: string;
  userAgent: string;
  details: string;
}

function generateAuditEvents(authenticatedUser: string): AuditEvent[] {
  const now = Date.now();
  const HOUR = 3600000;
  const DAY = 86400000;

  return [
    {
      id: "evt_001",
      timestamp: new Date(now - 2 * 60000).toISOString(),
      type: "auth",
      severity: "info",
      action: "user.login.success",
      actor: authenticatedUser,
      ip: "192.168.1.45",
      userAgent: "Chrome/126.0 (Windows NT 10.0)",
      details: "User authenticated via Asgardeo OIDC. MFA: enabled. Session created.",
    },
    {
      id: "evt_002",
      timestamp: new Date(now - 15 * 60000).toISOString(),
      type: "admin",
      severity: "info",
      action: "admin.data.access",
      actor: authenticatedUser,
      ip: "192.168.1.45",
      userAgent: "Chrome/126.0 (Windows NT 10.0)",
      details: "Admin accessed /api/admin-data endpoint. Bearer token validated via JWKS.",
    },
    {
      id: "evt_003",
      timestamp: new Date(now - 42 * 60000).toISOString(),
      type: "security",
      severity: "warning",
      action: "user.login.failed",
      actor: "unknown@attacker.com",
      ip: "45.33.32.156",
      userAgent: "curl/7.64.1",
      details: "Failed login attempt. Invalid credentials. IP flagged for monitoring.",
    },
    {
      id: "evt_004",
      timestamp: new Date(now - 1.5 * HOUR).toISOString(),
      type: "admin",
      severity: "info",
      action: "user.role.updated",
      actor: "admin@company.com",
      ip: "192.168.1.12",
      userAgent: "Chrome/126.0 (macOS)",
      details: "Role changed for user priya@company.com: Developer → Senior Developer",
    },
    {
      id: "evt_005",
      timestamp: new Date(now - 3 * HOUR).toISOString(),
      type: "security",
      severity: "critical",
      action: "user.login.brute_force",
      actor: "unknown",
      ip: "103.21.244.0",
      userAgent: "Python-urllib/3.8",
      details: "5 failed login attempts in 2 minutes from same IP. IP temporarily blocked.",
    },
    {
      id: "evt_006",
      timestamp: new Date(now - 5 * HOUR).toISOString(),
      type: "system",
      severity: "info",
      action: "token.jwks.refresh",
      actor: "system",
      ip: "internal",
      userAgent: "Next.js Server",
      details: "JWKS key set refreshed from Asgardeo. 2 public keys loaded.",
    },
    {
      id: "evt_007",
      timestamp: new Date(now - 8 * HOUR).toISOString(),
      type: "auth",
      severity: "info",
      action: "user.logout",
      actor: "sarah@company.com",
      ip: "192.168.1.78",
      userAgent: "Firefox/127.0 (Ubuntu)",
      details: "User signed out. Session terminated. Asgardeo session revoked.",
    },
    {
      id: "evt_008",
      timestamp: new Date(now - 12 * HOUR).toISOString(),
      type: "admin",
      severity: "warning",
      action: "api.rate_limit.exceeded",
      actor: "service-account-01",
      ip: "10.0.0.5",
      userAgent: "axios/1.6.0",
      details: "API rate limit exceeded on /api/analytics. 150 requests/min (limit: 100).",
    },
    {
      id: "evt_009",
      timestamp: new Date(now - 1 * DAY).toISOString(),
      type: "auth",
      severity: "info",
      action: "user.mfa.enrolled",
      actor: "marcus@company.com",
      ip: "192.168.1.90",
      userAgent: "Chrome/126.0 (Windows NT 10.0)",
      details: "User enrolled in TOTP-based MFA via Asgardeo. Authenticator app configured.",
    },
    {
      id: "evt_010",
      timestamp: new Date(now - 1.5 * DAY).toISOString(),
      type: "security",
      severity: "warning",
      action: "user.login.new_device",
      actor: "david@company.com",
      ip: "203.0.113.42",
      userAgent: "Safari/17.5 (iOS 18.0)",
      details: "Login from unrecognized device. Location: Colombo, LK. User verified via MFA.",
    },
    {
      id: "evt_011",
      timestamp: new Date(now - 2 * DAY).toISOString(),
      type: "system",
      severity: "info",
      action: "system.backup.completed",
      actor: "system",
      ip: "internal",
      userAgent: "Cron Scheduler",
      details: "Nightly database backup completed. Size: 2.4 GB. Duration: 45s.",
    },
    {
      id: "evt_012",
      timestamp: new Date(now - 3 * DAY).toISOString(),
      type: "admin",
      severity: "info",
      action: "org.member.invited",
      actor: authenticatedUser,
      ip: "192.168.1.45",
      userAgent: "Chrome/126.0 (Windows NT 10.0)",
      details: "New member invited: priya@company.com. Role: Developer. Invite sent via Asgardeo.",
    },
  ];
}

export async function GET(request: Request) {
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type");
  const severityFilter = url.searchParams.get("severity");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  let events = generateAuditEvents(result.token.sub || result.token.username || "unknown");

  if (typeFilter) {
    events = events.filter((e) => e.type === typeFilter);
  }
  if (severityFilter) {
    events = events.filter((e) => e.severity === severityFilter);
  }

  events = events.slice(0, limit);

  const allEvents = generateAuditEvents(result.token.sub || "");
  const summary = {
    total: allEvents.length,
    byType: {
      auth: allEvents.filter((e) => e.type === "auth").length,
      admin: allEvents.filter((e) => e.type === "admin").length,
      system: allEvents.filter((e) => e.type === "system").length,
      security: allEvents.filter((e) => e.type === "security").length,
    },
    bySeverity: {
      info: allEvents.filter((e) => e.severity === "info").length,
      warning: allEvents.filter((e) => e.severity === "warning").length,
      critical: allEvents.filter((e) => e.severity === "critical").length,
    },
  };

  return NextResponse.json({
    success: true,
    data: events,
    summary,
    _meta: {
      requestedBy: result.token.sub,
      filters: { type: typeFilter, severity: severityFilter, limit },
      validatedAt: new Date().toISOString(),
    },
  });
}

