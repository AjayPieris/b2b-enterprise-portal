import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

// Safe initialization of Asgardeo URL
const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "";
const EXPECTED_ISSUER = `${ASGARDEO_BASE_URL}/oauth2/token`;

// We create the JWKS client lazily to avoid crashing on server start if env is missing
let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwksClient() {
  if (!jwksClient) {
    if (!ASGARDEO_BASE_URL) {
      throw new Error("NEXT_PUBLIC_ASGARDEO_BASE_URL is not set in environment variables");
    }
    const JWKS_URI = new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`);
    jwksClient = createRemoteJWKSet(JWKS_URI);
  }
  return jwksClient;
}

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

/**
 * Validates the Authorization header from incoming requests.
 * Checks token signature against Asgardeo's JWKS and verifies expiry.
 */
export async function validateToken(
  request: Request
): Promise<
  | { valid: true; token: ValidatedToken }
  | { valid: false; error: string }
> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      valid: false,
      error: "Missing or malformed Authorization header. Expected: Bearer <token>",
    };
  }

  const token = authHeader.slice(7);

  try {
    const jwks = getJwksClient();
    
    // Verify the JWT signature, expiry, and issuer
    const { payload } = await jwtVerify(token, jwks, {
      issuer: EXPECTED_ISSUER,
    });

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
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[JWT Validation Error]:", err.message);

    if (err.message?.includes("expired")) {
      return { valid: false, error: "Token has expired. Please sign in again." };
    }
    if (err.message?.includes("signature")) {
      return { valid: false, error: "Invalid token signature." };
    }
    if (err.message?.includes("issuer")) {
      return { valid: false, error: "Token issuer mismatch." };
    }

    return { valid: false, error: "Token validation failed." };
  }
}

/**
 * Checks if the user is an admin by looking at their groups/roles.
 */
export function isAdminToken(token: ValidatedToken): boolean {
  const allRoles = [
    ...(token.groups || []),
    ...(token.roles || []),
  ];
  return allRoles.some((role) => role.toLowerCase().includes("admin"));
}
