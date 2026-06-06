// ============================================================================
// Centralized Mock Data for B2B Enterprise Portal
// Provides realistic, presentation-ready data for all dashboard pages.
// ============================================================================

// ─── Companies ───────────────────────────────────────────────────────────────
export interface MockCompany {
  id: string;
  name: string;
  industry: string;
  plan: "Enterprise" | "Business" | "Startup";
  userLimit: number;
  status: "Active" | "Suspended" | "Trial";
  createdAt: string;
  domain: string;
  logo: string;
  userCount: number;
  monthlyRevenue: number;
  apiCallsToday: number;
  complianceScore: number;
  region: string;
  primaryContact: string;
  ssoProvider: string;
}

export const mockCompanies: MockCompany[] = [
  {
    id: "org_01",
    name: "Nexus Financial",
    industry: "Finance",
    plan: "Enterprise",
    userLimit: 500,
    status: "Active",
    createdAt: "2024-01-15",
    domain: "nexusfinancial.com",
    logo: "NF",
    userCount: 342,
    monthlyRevenue: 24500,
    apiCallsToday: 18420,
    complianceScore: 98,
    region: "North America",
    primaryContact: "Victoria Sterling",
    ssoProvider: "Microsoft Entra ID",
  },
  {
    id: "org_02",
    name: "CloudForge Labs",
    industry: "Technology",
    plan: "Enterprise",
    userLimit: 1000,
    status: "Active",
    createdAt: "2023-08-22",
    domain: "cloudforgelabs.io",
    logo: "CF",
    userCount: 891,
    monthlyRevenue: 42000,
    apiCallsToday: 45200,
    complianceScore: 96,
    region: "Europe",
    primaryContact: "Henrik Johansson",
    ssoProvider: "Google Workspace",
  },
  {
    id: "org_03",
    name: "MediCore Health",
    industry: "Healthcare",
    plan: "Enterprise",
    userLimit: 300,
    status: "Active",
    createdAt: "2024-03-10",
    domain: "medicore.health",
    logo: "MC",
    userCount: 187,
    monthlyRevenue: 18900,
    apiCallsToday: 9340,
    complianceScore: 100,
    region: "North America",
    primaryContact: "Dr. Priya Kapoor",
    ssoProvider: "Okta",
  },
  {
    id: "org_04",
    name: "QuantumEdge AI",
    industry: "Technology",
    plan: "Business",
    userLimit: 200,
    status: "Active",
    createdAt: "2024-06-01",
    domain: "quantumedge.ai",
    logo: "QE",
    userCount: 124,
    monthlyRevenue: 8500,
    apiCallsToday: 12780,
    complianceScore: 91,
    region: "Asia Pacific",
    primaryContact: "Tanaka Hiroshi",
    ssoProvider: "Asgardeo Native",
  },
  {
    id: "org_05",
    name: "Ironclad Manufacturing",
    industry: "Manufacturing",
    plan: "Business",
    userLimit: 150,
    status: "Active",
    createdAt: "2024-02-28",
    domain: "ironclad-mfg.com",
    logo: "IM",
    userCount: 98,
    monthlyRevenue: 6200,
    apiCallsToday: 3450,
    complianceScore: 88,
    region: "Europe",
    primaryContact: "Klaus Weber",
    ssoProvider: "Microsoft Entra ID",
  },
  {
    id: "org_06",
    name: "Apex Retail Group",
    industry: "Retail",
    plan: "Business",
    userLimit: 250,
    status: "Active",
    createdAt: "2024-04-12",
    domain: "apexretail.co",
    logo: "AR",
    userCount: 176,
    monthlyRevenue: 9800,
    apiCallsToday: 7890,
    complianceScore: 94,
    region: "North America",
    primaryContact: "Sarah Chen",
    ssoProvider: "Google Workspace",
  },
  {
    id: "org_07",
    name: "Verdant Energy",
    industry: "Energy",
    plan: "Enterprise",
    userLimit: 400,
    status: "Active",
    createdAt: "2023-11-05",
    domain: "verdantenergy.io",
    logo: "VE",
    userCount: 265,
    monthlyRevenue: 31000,
    apiCallsToday: 14200,
    complianceScore: 97,
    region: "Europe",
    primaryContact: "Elise Dupont",
    ssoProvider: "Okta",
  },
  {
    id: "org_08",
    name: "Lattice Dynamics",
    industry: "Technology",
    plan: "Startup",
    userLimit: 50,
    status: "Trial",
    createdAt: "2025-05-20",
    domain: "latticedyn.dev",
    logo: "LD",
    userCount: 12,
    monthlyRevenue: 0,
    apiCallsToday: 890,
    complianceScore: 82,
    region: "Asia Pacific",
    primaryContact: "Ravi Patel",
    ssoProvider: "Asgardeo Native",
  },
  {
    id: "org_09",
    name: "Sentinel Cybersecurity",
    industry: "Security",
    plan: "Enterprise",
    userLimit: 200,
    status: "Active",
    createdAt: "2024-07-18",
    domain: "sentinelcyber.com",
    logo: "SC",
    userCount: 156,
    monthlyRevenue: 22000,
    apiCallsToday: 28900,
    complianceScore: 100,
    region: "North America",
    primaryContact: "Marcus Chen",
    ssoProvider: "Microsoft Entra ID",
  },
];

// ─── Team Members ────────────────────────────────────────────────────────────
export interface MockTeamMember {
  id: string;
  name: string;
  email: string;
  role: "Super Admin" | "Admin" | "Editor" | "Viewer";
  status: "Active" | "Invited" | "Suspended";
  joinedAt: string;
  department: string;
  lastActive: string;
  mfaEnabled: boolean;
  avatar: string;
}

export const mockTeamMembers: MockTeamMember[] = [
  { id: "usr_01", name: "Victoria Sterling", email: "v.sterling@enterprise.io", role: "Super Admin", status: "Active", joinedAt: "2023-06-15", department: "Executive", lastActive: "2 min ago", mfaEnabled: true, avatar: "VS" },
  { id: "usr_02", name: "Marcus Chen", email: "m.chen@enterprise.io", role: "Admin", status: "Active", joinedAt: "2023-08-20", department: "Security", lastActive: "5 min ago", mfaEnabled: true, avatar: "MC" },
  { id: "usr_03", name: "Priya Kapoor", email: "p.kapoor@enterprise.io", role: "Admin", status: "Active", joinedAt: "2023-09-10", department: "Engineering", lastActive: "12 min ago", mfaEnabled: true, avatar: "PK" },
  { id: "usr_04", name: "James Rodriguez", email: "j.rodriguez@enterprise.io", role: "Editor", status: "Active", joinedAt: "2024-01-05", department: "Product", lastActive: "1 hr ago", mfaEnabled: true, avatar: "JR" },
  { id: "usr_05", name: "Emily Nakamura", email: "e.nakamura@enterprise.io", role: "Editor", status: "Active", joinedAt: "2024-02-14", department: "DevOps", lastActive: "3 hr ago", mfaEnabled: true, avatar: "EN" },
  { id: "usr_06", name: "David Kim", email: "d.kim@enterprise.io", role: "Viewer", status: "Active", joinedAt: "2024-03-22", department: "Finance", lastActive: "6 hr ago", mfaEnabled: false, avatar: "DK" },
  { id: "usr_07", name: "Rachel Thompson", email: "r.thompson@enterprise.io", role: "Viewer", status: "Active", joinedAt: "2024-04-18", department: "Marketing", lastActive: "1 day ago", mfaEnabled: false, avatar: "RT" },
  { id: "usr_08", name: "Alex Rivera", email: "a.rivera@enterprise.io", role: "Editor", status: "Active", joinedAt: "2024-05-30", department: "Support", lastActive: "30 min ago", mfaEnabled: true, avatar: "AR" },
  { id: "usr_09", name: "Sofia Andersen", email: "s.andersen@enterprise.io", role: "Viewer", status: "Invited", joinedAt: "2025-06-01", department: "Legal", lastActive: "Pending", mfaEnabled: false, avatar: "SA" },
  { id: "usr_10", name: "Omar Hassan", email: "o.hassan@enterprise.io", role: "Admin", status: "Active", joinedAt: "2024-07-12", department: "IT Ops", lastActive: "45 min ago", mfaEnabled: true, avatar: "OH" },
];

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export const mockDashboardStats = {
  totalUsers: "2,251",
  activeSessions: "184",
  systemHealth: "Operational",
  apiRequests: "127.4K",
  totalOrganizations: "9",
  mfaAdoption: "94%",
  avgResponseTime: "42ms",
  uptime: "99.98%",
};

// ─── Revenue / Growth Data ───────────────────────────────────────────────────
export const mockRevenueData = [
  { month: "Jan", revenue: 82400, users: 1420 },
  { month: "Feb", revenue: 89200, users: 1580 },
  { month: "Mar", revenue: 94800, users: 1720 },
  { month: "Apr", revenue: 102300, users: 1860 },
  { month: "May", revenue: 118500, users: 2040 },
  { month: "Jun", revenue: 132900, users: 2251 },
];

// ─── API Traffic by Hour ─────────────────────────────────────────────────────
export const mockHourlyTraffic = [
  { hour: "00:00", requests: 1240 },
  { hour: "02:00", requests: 890 },
  { hour: "04:00", requests: 620 },
  { hour: "06:00", requests: 2100 },
  { hour: "08:00", requests: 5840 },
  { hour: "09:00", requests: 8920 },
  { hour: "10:00", requests: 12400 },
  { hour: "11:00", requests: 14200 },
  { hour: "12:00", requests: 11800 },
  { hour: "13:00", requests: 13500 },
  { hour: "14:00", requests: 15100 },
  { hour: "15:00", requests: 13200 },
  { hour: "16:00", requests: 10800 },
  { hour: "17:00", requests: 7600 },
  { hour: "18:00", requests: 4200 },
  { hour: "20:00", requests: 2800 },
  { hour: "22:00", requests: 1800 },
];

// ─── Security Overview ───────────────────────────────────────────────────────
export const mockSecurityMetrics = {
  threatScore: 12, // out of 100, lower is better
  blockedThreats24h: 847,
  suspiciousIPs: 23,
  activePolicies: 14,
  complianceStatus: "SOC 2 Type II",
  lastPenTest: "2025-04-15",
  certificateExpiry: "2025-09-22",
  encryptionStandard: "AES-256-GCM",
};

export const mockSecurityEvents = [
  { id: "sec_01", type: "Brute Force Attempt", severity: "high" as const, ip: "185.220.101.42", location: "Moscow, Russia", timestamp: "2 min ago", blocked: true },
  { id: "sec_02", type: "Suspicious OAuth Token", severity: "medium" as const, ip: "45.33.32.156", location: "San Francisco, US", timestamp: "18 min ago", blocked: false },
  { id: "sec_03", type: "Rate Limit Exceeded", severity: "low" as const, ip: "104.16.249.5", location: "London, UK", timestamp: "34 min ago", blocked: true },
  { id: "sec_04", type: "Unusual Login Location", severity: "medium" as const, ip: "203.45.128.12", location: "Tokyo, Japan", timestamp: "1 hr ago", blocked: false },
  { id: "sec_05", type: "Failed MFA Verification", severity: "high" as const, ip: "198.51.100.23", location: "Berlin, Germany", timestamp: "2 hr ago", blocked: true },
  { id: "sec_06", type: "Token Replay Attack", severity: "critical" as const, ip: "185.220.101.42", location: "Moscow, Russia", timestamp: "3 hr ago", blocked: true },
  { id: "sec_07", type: "Credential Stuffing", severity: "high" as const, ip: "52.14.89.201", location: "São Paulo, Brazil", timestamp: "4 hr ago", blocked: true },
  { id: "sec_08", type: "API Key Exposure Detected", severity: "critical" as const, ip: "Internal", location: "CI/CD Pipeline", timestamp: "6 hr ago", blocked: true },
];

export const mockGeoThreats = [
  { country: "Russia", attempts: 342, blocked: 342 },
  { country: "China", attempts: 189, blocked: 185 },
  { country: "Brazil", attempts: 124, blocked: 118 },
  { country: "Iran", attempts: 87, blocked: 87 },
  { country: "Nigeria", attempts: 56, blocked: 52 },
  { country: "India", attempts: 49, blocked: 41 },
];

// ─── Recent Activity for Dashboard ──────────────────────────────────────────
export const mockRecentActivity = [
  { id: 1, action: "New organization provisioned", actor: "Victoria Sterling", target: "Lattice Dynamics", time: "3 min ago", type: "admin" as const },
  { id: 2, action: "User role escalated to Admin", actor: "Marcus Chen", target: "Omar Hassan", time: "12 min ago", type: "security" as const },
  { id: 3, action: "SSO connection configured", actor: "Priya Kapoor", target: "Okta → MediCore Health", time: "28 min ago", type: "integration" as const },
  { id: 4, action: "API rate limit policy updated", actor: "Emily Nakamura", target: "Gateway v2.4", time: "45 min ago", type: "system" as const },
  { id: 5, action: "Compliance report exported", actor: "David Kim", target: "SOC 2 Type II - Q2 2025", time: "1 hr ago", type: "audit" as const },
  { id: 6, action: "Failed login attempts detected", actor: "System", target: "185.220.101.42 (5 attempts)", time: "2 hr ago", type: "security" as const },
  { id: 7, action: "TLS certificate renewed", actor: "cert-manager", target: "api.enterprise.io", time: "4 hr ago", type: "system" as const },
  { id: 8, action: "User bulk import completed", actor: "Alex Rivera", target: "CloudForge Labs (+24 users)", time: "6 hr ago", type: "admin" as const },
];

// ─── Top Endpoints for Gateway ───────────────────────────────────────────────
export const mockTopEndpoints = [
  { endpoint: "/oauth2/token", calls: 45200, avgLatency: 28, errorRate: 0.2 },
  { endpoint: "/scim2/Users", calls: 18400, avgLatency: 42, errorRate: 0.8 },
  { endpoint: "/api/admin-data", calls: 12800, avgLatency: 35, errorRate: 0.1 },
  { endpoint: "/oauth2/authorize", calls: 9600, avgLatency: 18, errorRate: 0.0 },
  { endpoint: "/api/analytics", calls: 8200, avgLatency: 52, errorRate: 0.3 },
  { endpoint: "/api/audit-logs", calls: 6400, avgLatency: 68, errorRate: 0.5 },
  { endpoint: "/oauth2/introspect", calls: 5100, avgLatency: 12, errorRate: 0.0 },
  { endpoint: "/api/gateway", calls: 4800, avgLatency: 22, errorRate: 0.1 },
];

// ─── Organization Distribution ───────────────────────────────────────────────
export const mockOrgDistribution = {
  byPlan: { Enterprise: 5, Business: 3, Startup: 1 },
  byRegion: { "North America": 4, "Europe": 3, "Asia Pacific": 2 },
  byIndustry: { Technology: 3, Finance: 1, Healthcare: 1, Manufacturing: 1, Retail: 1, Energy: 1, Security: 1 },
};

// ─── Uptime Status ───────────────────────────────────────────────────────────
export const mockUptimeData = [
  { service: "Authentication Service", uptime: 99.99, status: "operational" as const },
  { service: "SCIM 2.0 Provisioning", uptime: 99.98, status: "operational" as const },
  { service: "API Gateway", uptime: 99.97, status: "operational" as const },
  { service: "Audit Log Engine", uptime: 100.0, status: "operational" as const },
  { service: "Webhook Processor", uptime: 99.95, status: "operational" as const },
  { service: "Alert Rules Engine", uptime: 99.99, status: "operational" as const },
];
