/**
 * Admin Data API Route
 * 
 * ENDPOINT: GET /api/admin-data
 * PURPOSE: Returns enterprise dashboard statistics (billing, users, server health)
 * AUTH: Requires a valid Asgardeo JWT token (validated via JWKS)
 * 
 * FLOW:
 * 1. Client sends request with header: Authorization: Bearer <asgardeo-jwt>
 * 2. validateToken() verifies the JWT signature against Asgardeo's public keys
 * 3. If valid → return the enterprise data
 * 4. If invalid → return 401 Unauthorized
 * 
 * WHAT CHANGED FROM BEFORE:
 * Before: We only checked if the header STARTS with "Bearer " (anyone could fake this)
 * Now: We cryptographically verify the token was signed by Asgardeo (unforgeable)
 */

import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";

export async function GET(request: Request) {
  // ── Validate the JWT token ──────────────────────────────────────────────
  // This calls our shared validation utility which:
  // 1. Extracts the Bearer token from the Authorization header
  // 2. Fetches Asgardeo's public keys from the JWKS endpoint
  // 3. Verifies the token's RSA signature
  // 4. Checks the token hasn't expired and the issuer matches our org
  const result = await validateToken(request);

  if (!result.valid) {
    // Token was missing, expired, tampered with, or from wrong issuer
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  // ── Token is valid! We can trust this request ───────────────────────────
  // result.token contains the verified claims from the JWT:
  // - result.token.sub     → User's unique ID
  // - result.token.groups  → Groups (for RBAC)
  // - result.token.email   → User's email
  console.log(`[Admin Data] Authenticated request from user: ${result.token.sub}`);

  // ── Return enterprise dashboard data ────────────────────────────────────
  // In a real production app, this data would come from a database.
  // For now we use realistic simulated data.
  return NextResponse.json({
    success: true,
    data: {
      totalBilling: "$54,230.00",
      activeUsers: 142,
      serverStatus: "Healthy",
    },
    // Include metadata about who accessed this endpoint (useful for audit logging)
    _meta: {
      requestedBy: result.token.sub,
      validatedAt: new Date().toISOString(),
      tokenExpiresAt: result.token.exp
        ? new Date(result.token.exp * 1000).toISOString()
        : null,
    },
  });
}