// shared type — used in audit-logs route, alert rules, and the alerts API
export interface AuditEvent {
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
