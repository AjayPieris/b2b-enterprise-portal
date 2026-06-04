import type { AuditEvent } from "./auditTypes";

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertActionType = "login_failure" | "generic";

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  message: string;
  actor: string;
  ip: string;
  triggeredAt: string;
  read: boolean;
  relatedEventId: string;
  actionType?: AlertActionType;
  subjectUser?: string;
  resolved?: boolean;
  resolvedAction?: "deleted" | "allowed" | "dismissed";
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
  actionType?: AlertActionType;
  evaluate: (event: AuditEvent, history: AuditEvent[]) => string | null;
}

function countRecentEvents(
  history: AuditEvent[],
  predicate: (e: AuditEvent) => boolean,
  windowMs: number
): number {
  const cutoff = Date.now() - windowMs;
  return history.filter(
    (e) => predicate(e) && new Date(e.timestamp).getTime() >= cutoff
  ).length;
}

function isOutsideBusinessHours(): boolean {
  const hour = new Date().getHours();
  return hour < 9 || hour >= 18;
}

export const ALERT_RULES: AlertRule[] = [
  {
    id: "rule_failed_login_burst",
    name: "Brute Force Detection",
    description: "3+ failed logins from the same actor within 2 minutes",
    severity: "high",
    enabled: true,
    actionType: "login_failure",
    evaluate(event, history) {
      if (event.action !== "user.login.failed") return null;

      const count = countRecentEvents(
        history,
        (e) => e.action === "user.login.failed" && e.actor === event.actor,
        2 * 60 * 1000
      );

      if (count >= 3) {
        return `Brute force suspected: ${event.actor} failed login ${count} times in 2 minutes (IP: ${event.ip}).`;
      }
      return null;
    },
  },

  {
    id: "rule_single_login_failure",
    name: "Login Failure Detected",
    description: "A user login attempt failed",
    severity: "medium",
    enabled: true,
    actionType: "login_failure",
    evaluate(event) {
      if (event.action !== "user.login.failed") return null;
      return `Failed login attempt for ${event.actor} from IP ${event.ip}.`;
    },
  },

  {
    id: "rule_after_hours_access",
    name: "After-Hours Access",
    description: "Login outside business hours (9am–6pm)",
    severity: "medium",
    enabled: true,
    evaluate(event) {
      if (event.action !== "user.login.success") return null;
      if (!isOutsideBusinessHours()) return null;

      const hour = new Date().getHours();
      return `After-hours login: ${event.actor} logged in at ${hour}:00 from IP ${event.ip}.`;
    },
  },

  {
    id: "rule_privilege_escalation",
    name: "Privilege Escalation",
    description: "A user was granted Admin role",
    severity: "critical",
    enabled: true,
    evaluate(event) {
      if (
        event.action === "user.role.updated" &&
        event.details.toLowerCase().includes("admin")
      ) {
        return `Privilege escalation: ${event.actor} was granted Admin. Verify this was intentional.`;
      }
      return null;
    },
  },

  {
    id: "rule_bulk_user_delete",
    name: "Bulk User Deletion",
    description: "3+ users deleted within 5 minutes",
    severity: "critical",
    enabled: true,
    evaluate(event, history) {
      if (event.action !== "user.deleted") return null;

      const count = countRecentEvents(
        history,
        (e) => e.action === "user.deleted",
        5 * 60 * 1000
      );

      if (count >= 3) {
        return `Bulk deletion: ${count} users removed in the last 5 minutes. Actor: ${event.actor}.`;
      }
      return null;
    },
  },

  {
    id: "rule_repeated_api_errors",
    name: "API Abuse Detection",
    description: "10+ security events within 1 minute",
    severity: "high",
    enabled: true,
    evaluate(event, history) {
      if (event.type !== "security") return null;

      const count = countRecentEvents(
        history,
        (e) => e.type === "security",
        60 * 1000
      );

      if (count >= 10) {
        return `API abuse suspected: ${count} security events in 60 seconds. Actor: ${event.actor}.`;
      }
      return null;
    },
  },
];

export function evaluateRules(
  event: AuditEvent,
  history: AuditEvent[]
): TriggeredAlert[] {
  const triggered: TriggeredAlert[] = [];

  for (const rule of ALERT_RULES) {
    if (!rule.enabled) continue;

    const message = rule.evaluate(event, history);
    if (message) {
      triggered.push({
        id: `alert_${Date.now()}_${rule.id}`,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        message,
        actor: event.actor,
        ip: event.ip,
        triggeredAt: new Date().toISOString(),
        read: false,
        relatedEventId: event.id,
        actionType: rule.actionType,
        subjectUser: rule.actionType === "login_failure" ? event.actor : undefined,
        resolved: false,
      });
    }
  }

  return triggered;
}
