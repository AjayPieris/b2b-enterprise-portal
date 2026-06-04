import { NextResponse } from "next/server";
import { validateToken, isAdminToken } from "../../../lib/auth";
import { resolveAlert } from "../../../lib/alertStore";

const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "";
const M2M_CLIENT_ID = process.env.ASGARDEO_M2M_CLIENT_ID || "";
const M2M_CLIENT_SECRET = process.env.ASGARDEO_M2M_CLIENT_SECRET || "";

// Cache token for up to 50 minutes to avoid redundant OAuth request round-trips
let cachedM2MToken: string | null = null;
let tokenExpiresAt = 0;

async function getM2MToken(): Promise<string> {
  if (cachedM2MToken && Date.now() < tokenExpiresAt) return cachedM2MToken;

  const creds = Buffer.from(`${M2M_CLIENT_ID}:${M2M_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${ASGARDEO_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`,
    },
    body: "grant_type=client_credentials&scope=internal_user_mgt_delete internal_user_mgt_update internal_user_mgt_list internal_user_mgt_view",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`M2M token error ${res.status}: ${err}`);
  }

  const data = await res.json();
  cachedM2MToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedM2MToken!;
}

async function findUserId(username: string, m2mToken: string): Promise<string | null> {
  const filter = encodeURIComponent(`userName eq "${username}"`);
  const res = await fetch(
    `${ASGARDEO_BASE_URL}/scim2/Users?filter=${filter}&count=1`,
    { headers: { Authorization: `Bearer ${m2mToken}` } }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.Resources?.[0]?.id ?? null;
}

export async function POST(request: Request) {
  // Validate token signature and check admin status
  const authResult = await validateToken(request);
  if (!authResult.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminToken(authResult.token)) {
    return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
  }

  let body: { action?: string; username?: string; alertId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, username, alertId } = body;

  if (!action || !username) {
    return NextResponse.json(
      { error: "Required fields: action (delete|allow), username" },
      { status: 400 }
    );
  }

  if (action !== "delete" && action !== "allow") {
    return NextResponse.json(
      { error: "action must be 'delete' or 'allow'" },
      { status: 400 }
    );
  }

  let m2mToken: string;
  try {
    m2mToken = await getM2MToken();
  } catch (e) {
    console.error("[UserAction] M2M token error:", e);
    return NextResponse.json(
      { error: "Could not obtain management token. Check M2M credentials." },
      { status: 502 }
    );
  }

  const userId = await findUserId(username, m2mToken);
  if (!userId) {
    if (alertId) resolveAlert(alertId, action === "delete" ? "deleted" : "allowed");
    return NextResponse.json(
      { warning: `User '${username}' not found in Asgardeo. Alert resolved.` },
      { status: 200 }
    );
  }

  if (action === "delete") {
    const delRes = await fetch(`${ASGARDEO_BASE_URL}/scim2/Users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${m2mToken}` },
    });

    if (!delRes.ok && delRes.status !== 204) {
      const errBody = await delRes.text();
      console.error("[UserAction] SCIM DELETE failed:", delRes.status, errBody);
      return NextResponse.json(
        { error: `Failed to delete user: ${delRes.status}` },
        { status: 502 }
      );
    }

    if (alertId) resolveAlert(alertId, "deleted");
    return NextResponse.json({ success: true, action: "deleted", username });
  }

  if (action === "allow") {
    const patchRes = await fetch(`${ASGARDEO_BASE_URL}/scim2/Users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${m2mToken}`,
        "Content-Type": "application/scim+json",
      },
      body: JSON.stringify({
        schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        Operations: [
          { op: "replace", path: "active", value: true },
        ],
      }),
    });

    if (!patchRes.ok) {
      const errBody = await patchRes.text();
      console.error("[UserAction] SCIM PATCH failed:", patchRes.status, errBody);
      return NextResponse.json(
        { error: `Failed to unlock user: ${patchRes.status}` },
        { status: 502 }
      );
    }

    if (alertId) resolveAlert(alertId, "allowed");
    return NextResponse.json({ success: true, action: "allowed", username });
  }
}
