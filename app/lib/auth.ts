// JWT Token Validation Utility

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
 
const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL!;
const JWKS_URI = new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`);
const EXPECTED_ISSUER = `${ASGARDEO_BASE_URL}/oauth2/token`;
const jwks = createRemoteJWKSet(JWKS_URI);


export interface ValidatedToken {

  sub: string;
  email?: string;
  username?: string;
  groups?: string[];
  roles?: string[];
  exp?: number;
  iat?: number;
  raw: JWTPayload;
}

// ---------------------------------------------------------------------------
// 4) MAIN VALIDATION FUNCTION
// ---------------------------------------------------------------------------

/**
 * Validates an incoming HTTP request's Authorization header.
 * 
 * USAGE in an API route:
 *   const result = await validateToken(request);
 *   if (!result.valid) {
 *     return NextResponse.json({ error: result.error }, { status: 401 });
 *   }
 *   // Use result.token.sub, result.token.groups, etc.
 * 
 * @param request - The incoming HTTP request
 * @returns Either { valid: true, token: ValidatedToken } or { valid: false, error: string }
 */
export async function validateToken(
  request: Request
): Promise<
  | { valid: true; token: ValidatedToken }
  | { valid: false; error: string }
> {
  // --- Step A: Extract the token from the Authorization header ---
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      valid: false,
      error: "Missing or malformed Authorization header. Expected: Bearer <token>",
    };
  }

  // "Bearer eyJhbGciOiJSUz..." → "eyJhbGciOiJSUz..."
  const token = authHeader.slice(7); // Remove "Bearer " (7 characters)

  // --- Step B: Verify the JWT signature, expiry, and issuer ---
  try {
    /**
     * jwtVerify does THREE things:
     * 1. Fetches the public key from JWKS that matches the token's "kid" (Key ID)
     * 2. Verifies the token's RSA signature using that public key
     * 3. Checks that the token hasn't expired and the issuer matches
     * 
     * If ANY of these fail, it throws an error → the token is rejected.
     */
    const { payload } = await jwtVerify(token, jwks, {
      issuer: EXPECTED_ISSUER,
      // We don't check "audience" here because Asgardeo SPA tokens
      // may have varying audience values depending on configuration
    });

    // --- Step C: Extract useful claims from the validated payload ---
    const validatedToken: ValidatedToken = {
      sub: payload.sub || "",
      email: payload.email as string | undefined,
      username: payload.username as string | undefined,
      groups: payload.groups as string[] | undefined,
      roles: payload.roles as string[] | undefined,
      exp: payload.exp,
      iat: payload.iat,
      raw: payload,
    };

    return { valid: true, token: validatedToken };
  } catch (error: any) {
    /**
     * Common failure reasons:
     * - "JWS signature verification failed" → Token was tampered with
     * - "JWT expired" → Token's exp timestamp is in the past
     * - "unexpected issuer" → Token came from a different Asgardeo org
     * - Network error → Couldn't reach the JWKS endpoint
     */
    console.error("[JWT Validation Error]:", error.message);

    // Return a user-friendly error message
    if (error.message?.includes("expired")) {
      return { valid: false, error: "Token has expired. Please sign in again." };
    }
    if (error.message?.includes("signature")) {
      return { valid: false, error: "Invalid token signature. Authentication failed." };
    }
    if (error.message?.includes("issuer")) {
      return { valid: false, error: "Token issuer mismatch. Not from trusted identity provider." };
    }

    return { valid: false, error: "Token validation failed. Please sign in again." };
  }
}

// ---------------------------------------------------------------------------
// 5) HELPER: Check if user has admin role
// ---------------------------------------------------------------------------

/**
 * Checks if a validated token indicates admin privileges.
 * Looks for "admin" (case-insensitive) in both groups and roles claims.
 * 
 * @param token - The validated token from validateToken()
 * @returns true if the user has admin access
 */
export function isAdminToken(token: ValidatedToken): boolean {
  const allRoles = [
    ...(token.groups || []),
    ...(token.roles || []),
  ];
  return allRoles.some((role) => role.toLowerCase().includes("admin"));
}
