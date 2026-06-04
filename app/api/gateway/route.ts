import { NextResponse } from "next/server";
import { validateToken, isAdminToken } from "../../lib/auth";
import { generateSeedGatewayLogs } from "../../lib/mockSeed";

export const globalApiTrafficLogs: { timestamp: number; endpoint: string; status: number; latency: number }[] = [];

// Pre-populate with realistic traffic on first access
let seeded = false;
function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  const seedLogs = generateSeedGatewayLogs();
  globalApiTrafficLogs.push(...seedLogs);
}

export async function GET(request: Request) {
  ensureSeeded();

  const result = await validateToken(request);

  if (!result.valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminToken(result.token)) {
    return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
  }

  const now = Date.now();

  // Track this request in the traffic log
  globalApiTrafficLogs.push({
    timestamp: now,
    endpoint: "/api/gateway",
    status: 200,
    latency: Math.floor(Math.random() * 20) + 15,
  });

  const recentLogs = globalApiTrafficLogs.filter((log) => now - log.timestamp < 3600000);

  const totalRequests = recentLogs.length;
  const avgLatency = totalRequests > 0
    ? Math.round(recentLogs.reduce((acc, log) => acc + log.latency, 0) / totalRequests)
    : 0;

  const errorRate = totalRequests > 0
    ? ((recentLogs.filter((log) => log.status >= 400).length / totalRequests) * 100).toFixed(1)
    : "0.0";

  return NextResponse.json({
    success: true,
    data: {
      totalRequests,
      avgLatency,
      errorRate,
      recentLogs: recentLogs.slice(-20).reverse(),
    },
    _meta: { requestedBy: result.token.sub },
  });
}
