import { NextResponse } from "next/server";
import { globalAuditLogs } from "../audit-logs/route";
import { evaluateRules } from "../../lib/alertRules";
import { addAlert } from "../../lib/alertStore";
import type { AuditEvent } from "../../lib/auditTypes";

// GET /api/test-alert?scenario=brute_force|after_hours|privilege|bulk_delete
// No auth required — dev/demo testing only. Remove this route before going to prod.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scenario = url.searchParams.get("scenario") || "brute_force";

  const actor = "testuser@company.com";
  const ip = "192.168.1.42";
  const userAgent = "Mozilla/5.0 (Test Runner)";

  let eventsToInject: AuditEvent[] = [];

  if (scenario === "brute_force") {
    // inject 3 failed logins → triggers Brute Force rule
    eventsToInject = [1, 2, 3].map((i) => ({
      id: `test_fail_${Date.now()}_${i}`,
      timestamp: new Date().toISOString(),
      type: "auth",
      severity: "warning",
      action: "user.login.failed",
      actor,
      ip,
      userAgent,
      details: `Failed login attempt #${i} — wrong password`,
    }));
  } else if (scenario === "privilege") {
    // inject a role change → triggers Privilege Escalation rule
    eventsToInject = [
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
    ];
  } else if (scenario === "bulk_delete") {
    // inject 3 deletions → triggers Bulk Deletion rule
    eventsToInject = [1, 2, 3].map((i) => ({
      id: `test_del_${Date.now()}_${i}`,
      timestamp: new Date().toISOString(),
      type: "admin",
      severity: "critical",
      action: "user.deleted",
      actor: "admin@company.com",
      ip,
      userAgent,
      details: `User user${i}@company.com was permanently deleted`,
    }));
  } else if (scenario === "after_hours") {
    // inject a login success — only fires if current hour is outside 9-18
    eventsToInject = [
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
    ];
  } else if (scenario === "login_failed") {
    // inject a single failed login → triggers Login Failure Detected rule
    eventsToInject = [
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
    ];
  }

  // push events + run rules
  const triggeredSummary: string[] = [];
  for (const event of eventsToInject) {
    globalAuditLogs.push(event);
    const triggered = evaluateRules(event, globalAuditLogs);
    triggered.forEach((alert) => {
      addAlert(alert);
      triggeredSummary.push(`[${alert.severity.toUpperCase()}] ${alert.ruleName}: ${alert.message}`);
    });
  }

  return NextResponse.json({
    scenario,
    eventsInjected: eventsToInject.length,
    alertsTriggered: triggeredSummary.length,
    alerts: triggeredSummary,
    hint: triggeredSummary.length === 0
      ? "No alert fired. For after_hours, it only fires outside 9am–6pm."
      : "Check the bell icon in your dashboard header — it should show a red badge now!",
  });
}
