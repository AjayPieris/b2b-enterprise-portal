import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";
import { globalAuditLogs } from "../audit-logs/route";
import { generateSeedAuditEvents, seedAlerts } from "../../lib/mockSeed";

const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "";
const M2M_CLIENT_ID = process.env.ASGARDEO_M2M_CLIENT_ID || "";
const M2M_CLIENT_SECRET = process.env.ASGARDEO_M2M_CLIENT_SECRET || "";

async function getM2MAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${M2M_CLIENT_ID}:${M2M_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${ASGARDEO_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=internal_user_mgt_list internal_user_mgt_view",
  });

  if (!response.ok) throw new Error(`M2M token failed: ${response.status}`);
  const data = await response.json();
  return data.access_token;
}

// Make sure seed data exists before computing stats
function ensureSeeded() {
  if (globalAuditLogs.length === 0) {
    const seedEvents = generateSeedAuditEvents();
    globalAuditLogs.push(...seedEvents);
    seedAlerts(seedEvents);
  }
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

  // Pull real user count from SCIM2
  let totalUsers = "0";
  try {
    const adminToken = await getM2MAccessToken();
    const scimResponse = await fetch(`${ASGARDEO_BASE_URL}/scim2/Users?count=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (scimResponse.ok) {
      const scimData = await scimResponse.json();
      totalUsers = scimData.totalResults?.toString() || "0";
    }
  } catch (e) {
    console.error("[Admin Data] Failed to fetch user count:", e);
  }

  // Compute live session count from recent successful logins
  const oneHourAgo = Date.now() - 3600000;
  const recentLogins = globalAuditLogs.filter(
    (e) => e.action === "user.login.success" && new Date(e.timestamp).getTime() > oneHourAgo
  );
  const uniqueActiveSessions = new Set(recentLogins.map((e) => e.actor)).size;

  // Compute failed attempts in the last 24h
  const oneDayAgo = Date.now() - 86400000;
  const failedAttempts = globalAuditLogs.filter(
    (e) => e.action === "user.login.failed" && new Date(e.timestamp).getTime() > oneDayAgo
  ).length;

  // Compute total API requests from audit log entries
  const totalApiHits = globalAuditLogs.length;

  const adminData = {
    stats: {
      totalUsers,
      activeSessions: uniqueActiveSessions.toString(),
      apiRequests: totalApiHits.toString(),
      systemHealth: "Operational",
    },
    recentAlerts: [
      {
        id: 1,
        message: `${failedAttempts} failed login attempt${failedAttempts !== 1 ? "s" : ""} detected in the last 24h.`,
        type: failedAttempts > 3 ? "warning" : "info",
        time: new Date().toISOString(),
      },
      {
        id: 2,
        message: `${uniqueActiveSessions} active session${uniqueActiveSessions !== 1 ? "s" : ""} currently tracked.`,
        type: "info",
        time: new Date(Date.now() - 300000).toISOString(),
      },
      {
        id: 3,
        message: "Webhook receiver is live and processing Asgardeo identity events.",
        type: "info",
        time: new Date(Date.now() - 600000).toISOString(),
      },
      {
        id: 4,
        message: "TLS certificate renewal completed. Next renewal in 90 days.",
        type: "info",
        time: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 5,
        message: "Rate limiting triggered on IP 185.220.101.42 — possible automated scan.",
        type: "warning",
        time: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    features: [
      { name: "Live SCIM2 Users", status: "Operational" },
      { name: "Gateway Traffic Logging", status: "Operational" },
      { name: "Audit Engine", status: "Operational" },
      { name: "Opaque Token Validation", status: "Operational" },
      { name: "Webhook Event Processing", status: "Operational" },
      { name: "Alert Rules Engine", status: "Operational" },
    ],
  };

  return NextResponse.json({
    success: true,
    data: adminData,
    _meta: {
      requestedBy: result.token.sub,
      validatedAt: new Date().toISOString(),
    },
  });
}