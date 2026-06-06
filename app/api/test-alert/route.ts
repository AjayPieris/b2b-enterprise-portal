import { NextResponse } from "next/server";
import { globalAuditLogs } from "../audit-logs/route";
import { evaluateRules } from "../../lib/alertRules";
import { addAlert } from "../../lib/alertStore";
import type { AuditEvent } from "../../lib/auditTypes";

// GET /api/test-alert?scenario=brute_force|after_hours|privilege|bulk_delete
// No auth required — dev/demo testing only. Remove this route before going to prod.

type ScenarioGenerator = (actor: string, ip: string, userAgent: string) => AuditEvent[];

const SCENARIOS: Record<string, ScenarioGenerator> = {
  brute_force: (actor, ip, userAgent) => 
    [1, 2, 3].map((i) => ({
      id: `test_fail_${Date.now()}_${i}`,
      timestamp: new Date().toISOString(),
      type: "auth",
      severity: "warning",
      action: "user.login.failed",
      actor,
      ip,
      userAgent,
      details: `Failed login attempt #${i} — wrong password`,
    })),
  
  privilege: (actor, ip, userAgent) => [
    {
      id: `test_priv_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      severity: "critical",
      action: "user.role.updated",
      actor: "superadmin@company.com",
      ip,
      userAgent,
      details: `User ${actor} was assigned the Admin role by superadmin`,
    },
  ],

  bulk_delete: (_, ip, userAgent) => 
    [1, 2, 3].map((i) => ({
      id: `test_del_${Date.now()}_${i}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      severity: "critical",
      action: "user.deleted",
      actor: "admin@company.com",
      ip,
      userAgent,
      details: `User user${i}@company.com was permanently deleted`,
    })),

  after_hours: (actor, ip, userAgent) => [
    {
      id: `test_hours_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "auth",
      severity: "warning",
      action: "user.login.success",
      actor,
      ip,
      userAgent,
      details: "User logged in outside business hours",
    },
  ],

  login_failed: (actor, ip, userAgent) => [
    {
      id: `test_loginfail_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "auth",
      severity: "warning",
      action: "user.login.failed",
      actor,
      ip,
      userAgent,
      details: "Failed login attempt — wrong password",
    },
  ]
};

// Create some fake alerts to test the system
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenarioKey = searchParams.get("scenario") || "brute_force";

  const actor = "testuser@company.com";
  const ip = "192.168.1.42";
  const userAgent = "Mozilla/5.0 (Test Runner)";

  const generateEvents = SCENARIOS[scenarioKey];
  
  if (!generateEvents) {
    return NextResponse.json(
      { error: `Invalid scenario: ${scenarioKey}` }, 
      { status: 400 }
    );
  }

  const eventsToInject = generateEvents(actor, ip, userAgent);
  const triggeredSummary: string[] = [];

  // Inject events and process alerts
  for (const event of eventsToInject) {
    globalAuditLogs.push(event);
    
    const triggered = evaluateRules(event, globalAuditLogs);
    triggered.forEach((alert) => {
      addAlert(alert);
      triggeredSummary.push(`[${alert.severity.toUpperCase()}] ${alert.ruleName}: ${alert.message}`);
    });
  }

  return NextResponse.json({
    scenario: scenarioKey,
    eventsInjected: eventsToInject.length,
    alertsTriggered: triggeredSummary.length,
    alerts: triggeredSummary,
    hint: triggeredSummary.length === 0
      ? "No alert fired. For after_hours, it only fires outside 9am–6pm."
      : "Check the bell icon in your dashboard header — it should show a red badge now!",
  });
}
