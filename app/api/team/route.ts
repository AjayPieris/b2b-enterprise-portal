import { NextResponse } from "next/server";
import { validateToken, isAdminToken } from "../../lib/auth";

export async function GET(request: Request) {
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  // Additional check to ensure user is an Admin
  if (!isAdminToken(result.token)) {
    return NextResponse.json(
      { error: "Forbidden: Admin access required." },
      { status: 403 }
    );
  }

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

