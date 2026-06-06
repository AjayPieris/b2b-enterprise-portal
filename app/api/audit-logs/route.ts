import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";
import { evaluateRules } from "../../lib/alertRules";
import { addAlert } from "../../lib/alertStore";
import { generateSeedAuditEvents, seedAlerts } from "../../lib/mockSeed";
import type { AuditEvent } from "../../lib/auditTypes";

export const globalAuditLogs: AuditEvent[] = [];

// Seed realistic data on first server boot so the dashboard isn't empty
let isSeeded = false;

function ensureSeeded() {
  if (isSeeded) return;
  
  const initialEvents = generateSeedAuditEvents();
  globalAuditLogs.push(...initialEvents);
  seedAlerts(initialEvents);
  
  isSeeded = true;
}

function recordEvent(event: AuditEvent) {
  globalAuditLogs.push(event);
  
  const triggeredAlerts = evaluateRules(event, globalAuditLogs);
  triggeredAlerts.forEach(addAlert);
}

// Get the audit logs for the dashboard
export async function GET(request: Request) {
  ensureSeeded();

  const authResult = await validateToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${authResult.error}` },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const severity = searchParams.get("severity");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const userId = authResult.token?.sub || authResult.token?.email || "Admin";

  // Log this access event
  recordEvent({
    id: `evt_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "admin",
    severity: "info",
    action: "audit_logs.accessed",
    actor: userId,
    ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: request.headers.get("user-agent") || "Unknown",
    details: `User viewed audit logs (filters: type=${type || 'all'}, severity=${severity || 'all'})`,
  });

  // Filter and sort the logs
  let filteredLogs = globalAuditLogs;
  
  if (type) {
    filteredLogs = filteredLogs.filter(event => event.type === type);
  }
  
  if (severity) {
    filteredLogs = filteredLogs.filter(event => event.severity === severity);
  }

  const sortedLogs = [...filteredLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  // Calculate summary efficiently in a single pass
  const summary = globalAuditLogs.reduce(
    (acc, event) => {
      acc.total += 1;
      
      if (event.type in acc.byType) {
        acc.byType[event.type as keyof typeof acc.byType] += 1;
      }
      
      if (event.severity in acc.bySeverity) {
        acc.bySeverity[event.severity as keyof typeof acc.bySeverity] += 1;
      }
      
      return acc;
    },
    {
      total: 0,
      byType: { auth: 0, admin: 0, system: 0, security: 0 },
      bySeverity: { info: 0, warning: 0, critical: 0 },
    }
  );

  return NextResponse.json({
    success: true,
    data: sortedLogs,
    summary,
    _meta: {
      requestedBy: userId,
      filters: { type, severity, limit },
      validatedAt: new Date().toISOString(),
    },
  });
}
