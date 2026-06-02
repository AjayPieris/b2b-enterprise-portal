import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";

export async function GET(request: Request) {
  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${result.error}` },
      { status: 401 }
    );
  }

  // Simulated enterprise dashboard stats
  return NextResponse.json({
    success: true,
    data: {
      totalBilling: "$54,230.00",
      activeUsers: 142,
      serverStatus: "Healthy",
    },
    _meta: {
      requestedBy: result.token.sub,
      validatedAt: new Date().toISOString(),
      tokenExpiresAt: result.token.exp
        ? new Date(result.token.exp * 1000).toISOString()
        : null,
    },
  });
}