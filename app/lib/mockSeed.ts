import type { AuditEvent } from "./auditTypes";
import { evaluateRules } from "./alertRules";
import { addAlert } from "./alertStore";

// Realistic enterprise user pool representing a mid-size B2B org
const USERS = [
  { name: "Sarah Mitchell", email: "s.mitchell@acmecorp.io", role: "admin", department: "Engineering" },
  { name: "James Chen", email: "j.chen@acmecorp.io", role: "admin", department: "Security" },
  { name: "Priya Sharma", email: "p.sharma@acmecorp.io", role: "user", department: "Product" },
  { name: "Marcus Johnson", email: "m.johnson@acmecorp.io", role: "user", department: "Sales" },
  { name: "Emily Rodriguez", email: "e.rodriguez@acmecorp.io", role: "user", department: "Marketing" },
  { name: "David Kim", email: "d.kim@acmecorp.io", role: "user", department: "Engineering" },
  { name: "Olivia Thompson", email: "o.thompson@acmecorp.io", role: "user", department: "Finance" },
  { name: "Alex Nakamura", email: "a.nakamura@acmecorp.io", role: "user", department: "DevOps" },
  { name: "Rachel Green", email: "r.green@acmecorp.io", role: "user", department: "HR" },
  { name: "Tom Anderson", email: "t.anderson@acmecorp.io", role: "user", department: "Legal" },
  { name: "Lisa Wong", email: "l.wong@acmecorp.io", role: "admin", department: "IT Ops" },
  { name: "Carlos Rivera", email: "c.rivera@acmecorp.io", role: "user", department: "Support" },
];

// Geographically distributed IPs for realistic traffic patterns
const IP_POOL = [
  "203.45.128.12", "192.168.1.105", "10.0.42.88", "172.16.0.34",
  "45.33.32.156", "104.16.249.5", "198.51.100.23", "52.14.89.201",
  "13.107.42.14", "216.58.214.206", "151.101.1.140", "185.199.108.153",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 Safari/17.5",
  "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605.1.15 Mobile/15E148",
  "okhttp/4.12.0 (Android 14; Pixel 8 Pro)",
];

const API_ENDPOINTS = [
  "/api/admin-data", "/api/analytics", "/api/audit-logs", "/api/team",
  "/api/gateway", "/api/alerts", "/api/webhooks/asgardeo",
  "/api/admin/user-action", "/scim2/Users", "/oauth2/token",
  "/oauth2/introspect", "/oauth2/authorize", "/oauth2/userinfo",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a timestamp within the last N hours
function recentTimestamp(hoursBack: number): string {
  const offset = Math.random() * hoursBack * 60 * 60 * 1000;
  return new Date(Date.now() - offset).toISOString();
}

export function generateSeedAuditEvents(): AuditEvent[] {
  const events: AuditEvent[] = [];
  let idCounter = 1;

  // Successful logins spread across the last 12 hours
  for (let i = 0; i < 28; i++) {
    const user = randomItem(USERS);
    events.push({
      id: `seed_${idCounter++}`,
      timestamp: recentTimestamp(12),
      type: "auth",
      severity: "info",
      action: "user.login.success",
      actor: user.email,
      ip: randomItem(IP_POOL),
      userAgent: randomItem(USER_AGENTS),
      details: `${user.name} authenticated via Asgardeo SSO (${user.department}).`,
    });
  }

  // Failed login attempts (realistic brute force patterns)
  const suspiciousUser = randomItem(USERS);
  for (let i = 0; i < 5; i++) {
    events.push({
      id: `seed_${idCounter++}`,
      timestamp: recentTimestamp(2),
      type: "auth",
      severity: "warning",
      action: "user.login.failed",
      actor: suspiciousUser.email,
      ip: "185.220.101.42",
      userAgent: "python-requests/2.31.0",
      details: `Failed login for ${suspiciousUser.name}. Reason: invalid credentials.`,
    });
  }

  // Additional single failed attempts from different users
  for (let i = 0; i < 3; i++) {
    const user = randomItem(USERS);
    events.push({
      id: `seed_${idCounter++}`,
      timestamp: recentTimestamp(8),
      type: "auth",
      severity: "warning",
      action: "user.login.failed",
      actor: user.email,
      ip: randomItem(IP_POOL),
      userAgent: randomItem(USER_AGENTS),
      details: `Failed login for ${user.name}. Reason: expired password.`,
    });
  }

  // User provisioning events
  const newHires = [
    { name: "Jordan Hayes", email: "j.hayes@acmecorp.io" },
    { name: "Nina Patel", email: "n.patel@acmecorp.io" },
  ];
  for (const hire of newHires) {
    events.push({
      id: `seed_${idCounter++}`,
      timestamp: recentTimestamp(24),
      type: "admin",
      severity: "info",
      action: "user.created",
      actor: "s.mitchell@acmecorp.io",
      ip: "10.0.42.88",
      userAgent: randomItem(USER_AGENTS),
      details: `New user ${hire.name} (${hire.email}) provisioned via SCIM 2.0.`,
    });
  }

  // Role escalation event
  events.push({
    id: `seed_${idCounter++}`,
    timestamp: recentTimestamp(6),
    type: "admin",
    severity: "critical",
    action: "user.role.updated",
    actor: "j.chen@acmecorp.io",
    ip: "10.0.42.88",
    userAgent: randomItem(USER_AGENTS),
    details: `j.chen@acmecorp.io granted Admin role to l.wong@acmecorp.io.`,
  });

  // Password change events
  for (let i = 0; i < 4; i++) {
    const user = randomItem(USERS);
    events.push({
      id: `seed_${idCounter++}`,
      timestamp: recentTimestamp(48),
      type: "security",
      severity: "warning",
      action: "user.password.changed",
      actor: user.email,
      ip: randomItem(IP_POOL),
      userAgent: randomItem(USER_AGENTS),
      details: `${user.name} updated their password via self-service portal.`,
    });
  }

  // MFA enrollment events
  for (let i = 0; i < 3; i++) {
    const user = randomItem(USERS);
    events.push({
      id: `seed_${idCounter++}`,
      timestamp: recentTimestamp(72),
      type: "security",
      severity: "info",
      action: "user.mfa.enrolled",
      actor: user.email,
      ip: randomItem(IP_POOL),
      userAgent: randomItem(USER_AGENTS),
      details: `${user.name} enrolled TOTP authenticator for multi-factor auth.`,
    });
  }

  // System events
  events.push({
    id: `seed_${idCounter++}`,
    timestamp: recentTimestamp(1),
    type: "system",
    severity: "info",
    action: "system.health_check",
    actor: "system-monitor",
    ip: "127.0.0.1",
    userAgent: "HealthCheck/1.0",
    details: "Scheduled health check completed. All services operational.",
  });

  events.push({
    id: `seed_${idCounter++}`,
    timestamp: recentTimestamp(4),
    type: "system",
    severity: "info",
    action: "system.cert_renewal",
    actor: "cert-manager",
    ip: "127.0.0.1",
    userAgent: "CertManager/3.2",
    details: "TLS certificate for api.acmecorp.io renewed. Expires in 90 days.",
  });

  events.push({
    id: `seed_${idCounter++}`,
    timestamp: recentTimestamp(2),
    type: "system",
    severity: "warning",
    action: "system.rate_limit",
    actor: "api-gateway",
    ip: "185.220.101.42",
    userAgent: "python-requests/2.31.0",
    details: "Rate limit threshold reached (120 req/min) from IP 185.220.101.42.",
  });

  // Audit log access events from admins
  for (let i = 0; i < 6; i++) {
    const admin = randomItem(USERS.filter(u => u.role === "admin"));
    events.push({
      id: `seed_${idCounter++}`,
      timestamp: recentTimestamp(12),
      type: "admin",
      severity: "info",
      action: "audit_logs.accessed",
      actor: admin.email,
      ip: randomItem(IP_POOL),
      userAgent: randomItem(USER_AGENTS),
      details: `${admin.name} reviewed audit logs (filters: all events).`,
    });
  }

  // Sort by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}

// Generate realistic API gateway traffic logs for the last hour
export function generateSeedGatewayLogs() {
  const logs: { timestamp: number; endpoint: string; status: number; latency: number }[] = [];
  const now = Date.now();

  for (let i = 0; i < 45; i++) {
    const age = Math.random() * 3600000; // within last hour
    const endpoint = randomItem(API_ENDPOINTS);
    const isError = Math.random() < 0.06; // ~6% error rate

    logs.push({
      timestamp: now - age,
      endpoint,
      status: isError ? randomItem([401, 403, 429, 500, 502]) : 200,
      latency: isError ? randomBetween(200, 1500) : randomBetween(12, 85),
    });
  }

  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

// Run alert rules on the seed audit events to generate realistic alerts
export function seedAlerts(events: AuditEvent[]) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const history: AuditEvent[] = [];
  for (const event of sortedEvents) {
    history.push(event);
    const triggered = evaluateRules(event, history);
    triggered.forEach(addAlert);
  }
}
