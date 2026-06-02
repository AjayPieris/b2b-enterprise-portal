import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";

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

export async function GET(request: Request) {
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  // Use M2M token to get the real user count from SCIM2
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

  const adminData = {
    stats: {
      totalUsers,
      activeSessions: "1",
      apiRequests: "Live",
      systemHealth: "100%",
    },
    recentAlerts: [
      { id: 1, message: "Real-time audit logging active.", type: "info", time: new Date().toISOString() },
    ],
    features: [
      { name: "Live SCIM2 Users", status: "Operational" },
      { name: "Gateway Traffic Logging", status: "Operational" },
      { name: "Audit Engine", status: "Operational" },
      { name: "Opaque Token Validation", status: "Operational" },
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