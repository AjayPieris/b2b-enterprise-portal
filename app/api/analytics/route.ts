/**
 * Analytics API Route
 * 
 * ENDPOINT: GET /api/analytics
 * PURPOSE: Returns authentication metrics (login counts, auth methods, MFA stats)
 * AUTH: Requires a valid Asgardeo JWT token (validated via JWKS)
 * 
 * This data represents what you'd see in an enterprise identity analytics dashboard.
 * In production, this would query Asgardeo's analytics APIs or your own logging system.
 */

import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";

export async function GET(request: Request) {
  // ── Validate JWT against Asgardeo JWKS ──────────────────────────────────
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  console.log(`[Analytics] Authenticated request from user: ${result.token.sub}`);

  // ── Analytics data ──────────────────────────────────────────────────────
  // Simulated authentication analytics data.
  // In a real enterprise app, this would come from:
  // - Asgardeo's built-in analytics
  // - Your own database tracking login events
  // - An ELK stack or similar logging platform
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

  return NextResponse.json({
    success: true,
    data: analytics,
    _meta: {
      requestedBy: result.token.sub,
      validatedAt: new Date().toISOString(),
    },
  });
}
