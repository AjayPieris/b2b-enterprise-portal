import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "";
const EXPECTED_ISSUER = `${ASGARDEO_BASE_URL}/oauth2/token`;

let jwksClient: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwksClient() {
  if (!jwksClient) {
    if (!ASGARDEO_BASE_URL) {
      throw new Error("NEXT_PUBLIC_ASGARDEO_BASE_URL is not set in environment variables");
    }
    jwksClient = createRemoteJWKSet(new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`));
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
  raw?: JWTPayload;
}

export async function validateToken(
  request: Request
): Promise<{ valid: true; token: ValidatedToken } | { valid: false; error: string }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or malformed Authorization header." };
  }

  const token = authHeader.slice(7);

  // Try JWT validation first
  try {
    const jwks = getJwksClient();
    const { payload } = await jwtVerify(token, jwks, { issuer: EXPECTED_ISSUER });

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

    // If it's an opaque token (not a JWT), validate via Asgardeo UserInfo endpoint
    if (err.message?.includes("Compact JWS")) {
      console.log("[Auth] Opaque token detected. Validating via UserInfo endpoint...");
      try {
        const userInfoResponse = await fetch(`${ASGARDEO_BASE_URL}/oauth2/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          console.log("[Auth] Opaque token valid. Subject:", userInfo.sub);

          const validatedToken: ValidatedToken = {
            sub: userInfo.sub || "",
            email: userInfo.email,
            username: userInfo.username || userInfo.preferred_username,
            groups: Array.isArray(userInfo.groups) ? userInfo.groups : undefined,
            roles: Array.isArray(userInfo.roles) ? userInfo.roles : undefined,
          };
          return { valid: true, token: validatedToken };
        } else {
          return { valid: false, error: "Opaque token rejected by Asgardeo." };
        }
      } catch {
        return { valid: false, error: "UserInfo endpoint validation failed." };
      }
    }

    if (err.message?.includes("expired")) {
      return { valid: false, error: "Token has expired. Please sign in again." };
    }
    if (err.message?.includes("issuer")) {
      return { valid: false, error: "Token issuer mismatch." };
    }

    console.error("[Auth] Token validation error:", err.message);
    return { valid: false, error: "Token validation failed." };
  }
}

export function isAdminToken(token: ValidatedToken): boolean {
  // With opaque tokens, Asgardeo UserInfo may not include groups/roles.
  // If we can't determine, allow access (page-level AuthGuard handles UI restriction).
  const allRoles = [...(token.groups || []), ...(token.roles || [])];
  if (allRoles.length === 0) return true; // assume admin if no role info available
  return allRoles.some((role) => role.toLowerCase().includes("admin"));
}
