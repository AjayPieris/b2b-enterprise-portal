/**
 * Team API Route
 * 
 * ENDPOINT: GET /api/team
 * PURPOSE: Returns team member list for the organization
 * AUTH: Requires a valid Asgardeo JWT token (validated via JWKS)
 * ACCESS: Should only be accessed by Admin users (enforced on frontend by AuthGuard)
 * 
 * NOTE: In a full production setup, this would call Asgardeo's SCIM2 API
 * to fetch real users from your organization. The SCIM2 endpoint is:
 *   GET {baseUrl}/scim2/Users
 * This requires a Management Application (M2M) with client_credentials grant.
 * We'll implement that in a later step.
 */

import { NextResponse } from "next/server";
import { validateToken, isAdminToken } from "../../lib/auth";

export async function GET(request: Request) {
  // ── Validate JWT against Asgardeo JWKS ──────────────────────────────────
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  // ── Server-side RBAC check ──────────────────────────────────────────────
  // The frontend AuthGuard already blocks non-admin users from seeing this page.
  // But we ALSO check on the server side — this is defense-in-depth.
  // A malicious user could bypass the frontend and call /api/team directly.
  // This server-side check prevents that.
  if (!isAdminToken(result.token)) {
    return NextResponse.json(
      { error: "Forbidden: Admin access required. Your role does not permit this action." },
      { status: 403 }  // 403 Forbidden (authenticated but not authorized)
    );
  }

  console.log(`[Team] Admin access granted to user: ${result.token.sub}`);

  // ── Team member data ────────────────────────────────────────────────────
  // Simulated data — will be replaced with Asgardeo SCIM2 API calls later
  const teamMembers = [
    { id: 1, name: "Ajay Pieris", email: "ajay@company.com", role: "Admin", status: "Active", joinedAt: "2024-01-15" },
    { id: 2, name: "Sarah Chen", email: "sarah@company.com", role: "Developer", status: "Active", joinedAt: "2024-03-22" },
    { id: 3, name: "Marcus Johnson", email: "marcus@company.com", role: "Designer", status: "Active", joinedAt: "2024-05-10" },
    { id: 4, name: "Priya Sharma", email: "priya@company.com", role: "Developer", status: "Invited", joinedAt: "2024-06-01" },
    { id: 5, name: "David Kim", email: "david@company.com", role: "Manager", status: "Active", joinedAt: "2024-02-28" },
  ];

  return NextResponse.json({
    success: true,
    data: teamMembers,
    _meta: {
      requestedBy: result.token.sub,
      isAdmin: true,
      validatedAt: new Date().toISOString(),
    },
  });
}
