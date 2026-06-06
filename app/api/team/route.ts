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

async function getAdminToken(): Promise<string> {
  const credentials = Buffer.from(`${M2M_CLIENT_ID}:${M2M_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${ASGARDEO_BASE_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "internal_user_mgt_list internal_user_mgt_view"
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve M2M token: ${response.statusText}`);
  }

  const { access_token } = await response.json();
  return access_token;
}

function mapScimUserToDisplayUser(user: ScimUser) {
  const email = 
    user.emails?.find((e) => e.primary)?.value || 
    user.emails?.[0]?.value || 
    user.userName;

  const nameParts = [user.name?.givenName, user.name?.familyName].filter(Boolean);
  const displayName = 
    user.name?.formatted || 
    (nameParts.length ? nameParts.join(" ") : user.userName);

  const rolesAndGroups = [
    ...(user.roles?.map(r => r.display) || []),
    ...(user.groups?.map(g => g.display) || [])
  ];
  
  const isAdmin = rolesAndGroups.some(role => role.toLowerCase().includes("admin"));

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
}

// Get the list of all team members
export async function GET(request: Request) {
  try {
    const authResult = await validateToken(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: `Unauthorized: ${authResult.error}` },
        { status: 401 }
      );
    }

    const adminToken = await getAdminToken();
    const scimResponse = await fetch(`${ASGARDEO_BASE_URL}/scim2/Users`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!scimResponse.ok) {
      console.error(`[Team API] SCIM2 Request failed:`, await scimResponse.text());
      return NextResponse.json(
        { error: "Failed to fetch organization users from identity provider." },
        { status: 502 }
      );
    }

    const scimData = await scimResponse.json();
    const users = (scimData.Resources as ScimUser[] || []).map(mapScimUserToDisplayUser);

    return NextResponse.json({
      success: true,
      source: "asgardeo-scim2",
      data: users,
      _meta: {
        total: scimData.totalResults,
        requestedBy: authResult.token?.sub,
        validatedAt: new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error("[Team API] Unhandled exception:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching users." },
      { status: 500 }
    );
  }
}
