import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";
import { evaluateRules } from "../../lib/alertRules";
import { addAlert } from "../../lib/alertStore";
import { generateSeedAuditEvents, seedAlerts } from "../../lib/mockSeed";
import type { AuditEvent } from "../../lib/auditTypes";

export const globalAuditLogs: AuditEvent[] = [];

// Seed realistic data on first server boot so the dashboard isn't empty
let seeded = false;
function ensureSeeded() {
  if (seeded) return;
  seeded = true;

  const seedEvents = generateSeedAuditEvents();
  globalAuditLogs.push(...seedEvents);
  seedAlerts(seedEvents);
}

function pushEvent(event: AuditEvent) {
  globalAuditLogs.push(event);
  const triggered = evaluateRules(event, globalAuditLogs);
  triggered.forEach(addAlert);
}

export async function GET(request: Request) {
  ensureSeeded();

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

  pushEvent({
    id: `evt_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "admin",
    severity: "info",
    action: "audit_logs.accessed",
    actor: result.token.sub || result.token.email || "Admin",
    ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: request.headers.get("user-agent") || "Unknown",
    details: `User viewed audit logs with filters: type=${typeFilter}, severity=${severityFilter}`,
  });

  let events = [...globalAuditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (typeFilter) events = events.filter((e) => e.type === typeFilter);
  if (severityFilter) events = events.filter((e) => e.severity === severityFilter);

  events = events.slice(0, limit);

  const summary = {
    total: globalAuditLogs.length,
    byType: {
      auth: globalAuditLogs.filter((e) => e.type === "auth").length,
      admin: globalAuditLogs.filter((e) => e.type === "admin").length,
      system: globalAuditLogs.filter((e) => e.type === "system").length,
      security: globalAuditLogs.filter((e) => e.type === "security").length,
    },
    bySeverity: {
      info: globalAuditLogs.filter((e) => e.severity === "info").length,
      warning: globalAuditLogs.filter((e) => e.severity === "warning").length,
      critical: globalAuditLogs.filter((e) => e.severity === "critical").length,
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
