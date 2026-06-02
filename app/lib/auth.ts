/**
 * JWT Token Validation Utility
 * 
 * PURPOSE: Validates Asgardeo-issued JWT access tokens on every API request.
 * 
 * HOW IT WORKS:
 * 1. When a user logs in via Asgardeo, they receive a JWT (JSON Web Token)
 * 2. The JWT is signed by Asgardeo using RS256 (RSA + SHA-256)
 * 3. Asgardeo publishes its public keys at a JWKS (JSON Web Key Set) endpoint
 * 4. We fetch those public keys and verify the token's signature
 * 5. If the signature matches → the token is authentic (not forged)
 * 6. We also check: is the token expired? Is it from our Asgardeo org?
 * 
 * WHY THIS MATTERS:
 * Without this, anyone could send a fake "Bearer xyz" header and access your APIs.
 * With JWKS validation, only tokens genuinely issued by YOUR Asgardeo org are accepted.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// ---------------------------------------------------------------------------
// 1) ASGARDEO CONFIGURATION
// ---------------------------------------------------------------------------

/**
 * The base URL of your Asgardeo organization.
 * Example: "https://api.asgardeo.io/t/ajaypieris"
 * This is the same URL used in your AsgardeoProvider config.
 */
const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL!;

/**
 * JWKS URI — This is where Asgardeo publishes its public signing keys.
 * 
 * JWKS stands for "JSON Web Key Set". It's a standard endpoint that returns
 * the public keys used to sign JWTs. Every OAuth 2.0 provider has one.
 * 
 * Asgardeo's JWKS endpoint follows the pattern:
 *   {baseUrl}/oauth2/jwks
 * 
 * The `jose` library will fetch these keys and cache them automatically.
 */
const JWKS_URI = new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`);

/**
 * The expected "issuer" (iss) claim in the JWT.
 * 
 * Every JWT has an "iss" field that says "who created this token".
 * We verify it matches our Asgardeo org to prevent tokens from
 * other organizations being used.
 * 
 * Asgardeo issuer format: {baseUrl}/oauth2/token
 */
const EXPECTED_ISSUER = `${ASGARDEO_BASE_URL}/oauth2/token`;

// ---------------------------------------------------------------------------
// 2) JWKS CLIENT (Cached)
// ---------------------------------------------------------------------------

/**
 * createRemoteJWKSet creates a function that:
 * - Fetches the public keys from the JWKS URI
 * - Caches them in memory (doesn't fetch on every request)
 * - Automatically refreshes when keys rotate (key rotation is a security practice)
 * 
 * We create this ONCE at module level so it's reused across all API requests.
 */
const jwks = createRemoteJWKSet(JWKS_URI);

// ---------------------------------------------------------------------------
// 3) TYPES
// ---------------------------------------------------------------------------

/**
 * The shape of a validated token's payload.
 * These are the "claims" inside the JWT that tell us about the user.
 */
export interface ValidatedToken {
  /** The user's unique identifier (subject) — e.g., "a1b2c3-d4e5-f6g7" */
  sub: string;

  /** The user's email address */
  email?: string;

  /** The user's username */
  username?: string;

  /** Groups the user belongs to (used for RBAC) */
  groups?: string[];

  /** Roles assigned to the user */
  roles?: string[];

  /** When the token expires (Unix timestamp) */
  exp?: number;

  /** When the token was issued (Unix timestamp) */
  iat?: number;

  /** The full raw JWT payload for any additional claims */
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
