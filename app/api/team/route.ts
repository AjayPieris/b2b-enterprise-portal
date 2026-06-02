import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";

const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "";
const M2M_CLIENT_ID = process.env.ASGARDEO_M2M_CLIENT_ID || "";
const M2M_CLIENT_SECRET = process.env.ASGARDEO_M2M_CLIENT_SECRET || "";

interface ScimRole { display: string }
interface ScimGroup { display: string }
interface ScimUser {
  id: string;
  userName: string;
  name?: { formatted?: string; givenName?: string; familyName?: string };
  emails?: { value: string; primary?: boolean }[];
  roles?: ScimRole[];
  groups?: ScimGroup[];
  active?: boolean;
  meta?: { created?: string };
}

// Gets a server-side admin token using the M2M Client Credentials flow.
// This is separate from the user's SPA token — it runs only on the server.
async function getM2MAccessToken(): Promise<string> {
  const tokenUrl = `${ASGARDEO_BASE_URL}/oauth2/token`;
  const credentials = Buffer.from(`${M2M_CLIENT_ID}:${M2M_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=internal_user_mgt_list internal_user_mgt_view",
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`M2M token request failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: Request) {
  // 1. Verify the user making this request is authenticated (their SPA token)
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  try {
    // 2. Get a server-side admin token to call SCIM2 (not the user's browser token)
    const adminToken = await getM2MAccessToken();

    // 3. Use the admin token to fetch all org users from Asgardeo SCIM2
    const scimResponse = await fetch(`${ASGARDEO_BASE_URL}/scim2/Users`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`[Team API] SCIM2 response: ${scimResponse.status}`);

    if (!scimResponse.ok) {
      const errBody = await scimResponse.text();
      console.error(`[Team API] SCIM2 error:`, errBody);
      return NextResponse.json(
        { error: `Failed to fetch users from Asgardeo (${scimResponse.status}).` },
        { status: 502 }
      );
    }

    const scimData = await scimResponse.json();

    // 4. Map the SCIM2 response into the clean format the UI expects
    const users = (scimData.Resources as ScimUser[] || []).map((user) => {
      const email =
        user.emails?.find((e) => e.primary)?.value ||
        user.emails?.[0]?.value ||
        user.userName;

      const displayName =
        user.name?.formatted ||
        [user.name?.givenName, user.name?.familyName].filter(Boolean).join(" ") ||
        user.userName;

      const roleLabels = [
        ...(user.roles?.map((r) => r.display) || []),
        ...(user.groups?.map((g) => g.display) || []),
      ];
      const isAdmin = roleLabels.some((r) => r.toLowerCase().includes("admin"));

      return {
        id: user.id,
        name: displayName,
        email,
        role: isAdmin ? "Admin" : "User",
        status: user.active === false ? "Inactive" : "Active",
        joinedAt: user.meta?.created
          ? new Date(user.meta.created).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });

    return NextResponse.json({
      success: true,
      source: "asgardeo-scim2",
      data: users,
      _meta: {
        total: scimData.totalResults,
        requestedBy: result.token.sub,
        validatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Team API] Error:", error);
    return NextResponse.json(
      { error: "Internal error fetching organization users." },
      { status: 500 }
    );
  }
}
