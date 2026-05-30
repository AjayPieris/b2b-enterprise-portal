import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: No valid token provided" },
      { status: 401 }
    );
  }

  const analytics = {
    monthlyLogins: [
      { month: "Jan", count: 120 },
      { month: "Feb", count: 185 },
      { month: "Mar", count: 210 },
      { month: "Apr", count: 165 },
      { month: "May", count: 290 },
      { month: "Jun", count: 340 },
    ],
    authMethods: [
      { method: "Asgardeo SSO", percentage: 62 },
      { method: "Google Federation", percentage: 24 },
      { method: "Username/Password", percentage: 14 },
    ],
    summary: {
      totalLogins: "1,310",
      avgSessionTime: "24 min",
      failedAttempts: "23",
      mfaAdoption: "87%",
    },
  };

  return NextResponse.json({ success: true, data: analytics });
}
