import { NextResponse } from "next/server";
import { validateToken, isAdminToken } from "../../lib/auth";

const ASGARDEO_BASE_URL = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "";

export async function GET(request: Request) {
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  if (!isAdminToken(result.token)) {
    return NextResponse.json(
      { error: "Forbidden: Admin access required." },
      { status: 403 }
    );
  }

  // 1. We define the fallback mock data in case the SCIM2 API call fails
  const mockTeamMembers = [
    { id: "1", name: "Ajay Pieris", email: "ajay@company.com", role: "Admin", status: "Active", joinedAt: "2024-01-15" },
    { id: "2", name: "Sarah Chen", email: "sarah@company.com", role: "Developer", status: "Active", joinedAt: "2024-03-22" },
    { id: "3", name: "Marcus Johnson", email: "marcus@company.com", role: "Designer", status: "Active", joinedAt: "2024-05-10" },
    { id: "4", name: "Priya Sharma", email: "priya@company.com", role: "Developer", status: "Invited", joinedAt: "2024-06-01" },
    { id: "5", name: "David Kim", email: "david@company.com", role: "Manager", status: "Active", joinedAt: "2024-02-28" },
  ];

  try {
    // 2. Extract the exact token string the user sent us
    const token = request.headers.get("authorization")?.split(" ")[1];

    // 3. Try to call the real Asgardeo SCIM2 API
    const scimResponse = await fetch(`${ASGARDEO_BASE_URL}/scim2/Users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (scimResponse.ok) {
      const scimData = await scimResponse.json();
      
      interface ScimRole { display: string }
      interface ScimGroup { display: string }
      interface ScimUser {
        id: string;
        userName: string;
        name?: { formatted?: string };
        emails?: { value: string }[];
        roles?: ScimRole[];
        groups?: ScimGroup[];
        active?: boolean;
        meta?: { created?: string };
      }

      // 4. Map Asgardeo's complex SCIM2 format into our clean dashboard format
      const realUsers = scimData.Resources?.map((user: ScimUser) => {
        const email = user.emails?.[0]?.value || user.userName || "No email";
        // Check if Asgardeo gave them an admin role in their groups/roles
        const roles = user.roles?.map((r: ScimRole) => r.display).join(", ") || 
                     user.groups?.map((g: ScimGroup) => g.display).join(", ") || 
                     "User";
                     
        return {
          id: user.id,
          name: user.name?.formatted || user.userName,
          email: email,
          role: roles.toLowerCase().includes("admin") ? "Admin" : "User",
          status: user.active === false ? "Inactive" : "Active",
          joinedAt: new Date(user.meta?.created || Date.now()).toISOString().split('T')[0],
        };
      }) || [];

      return NextResponse.json({
        success: true,
        source: "asgardeo-scim2",
        data: realUsers,
        _meta: { requestedBy: result.token.sub, isAdmin: true, validatedAt: new Date().toISOString() },
      });
    } else {
      console.warn(`[Team API] SCIM2 call failed (${scimResponse.status}). Ensure the user has 'internal_user_mgt_list' scope.`);
      console.warn("[Team API] Falling back to mock data.");
    }
  } catch (error) {
    console.error("[Team API] Error calling SCIM2:", error);
  }

  // 5. If the SCIM2 call failed (usually because the SPA token doesn't have list scopes),
  // return the mock data gracefully without breaking the dashboard UI.
  return NextResponse.json({
    success: true,
    source: "mock-fallback",
    data: mockTeamMembers,
    _meta: { requestedBy: result.token.sub, isAdmin: true, validatedAt: new Date().toISOString() },
  });
}

