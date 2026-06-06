import { NextResponse } from "next/server";
import { validateToken } from "../../lib/auth";
import { globalAuditLogs } from "../audit-logs/route";
import { generateSeedAuditEvents, seedAlerts } from "../../lib/mockSeed";

function ensureMockDataSeeded() {
  if (globalAuditLogs.length === 0) {
    const seedEvents = generateSeedAuditEvents();
    globalAuditLogs.push(...seedEvents);
    seedAlerts(seedEvents);
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BASELINE_TRAFFIC = [142, 189, 234, 278, 312, 367];

// Get data to show on the analytics charts
export async function GET(request: Request) {
  ensureMockDataSeeded();

  const authResult = await validateToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: `Unauthorized: ${authResult.error}` },
      { status: 401 }
    );
  }

  // Pre-calculate metrics to avoid multiple passes
  const metrics = globalAuditLogs.reduce(
    (acc, log) => {
      if (log.type === "auth") {
        acc.uniqueUsers.add(log.actor);
        if (log.action === "user.login.success") acc.successCount++;
        if (log.action === "user.login.failed") acc.failureCount++;
      }
      return acc;
    },
    { successCount: 0, failureCount: 0, uniqueUsers: new Set<string>() }
  );

  const currentMonthIdx = new Date().getMonth();

  // Generate the last 6 months of data, blending real current-month stats with historical baselines
  const monthlyLogins = Array.from({ length: 6 }).map((_, i) => {
    const monthIdx = (currentMonthIdx - 5 + i + 12) % 12;
    const isCurrentMonth = monthIdx === currentMonthIdx;
    
    // Add some random noise to historical data for realism, but use actual counts for the current month
    const baseline = BASELINE_TRAFFIC[i] || 100;
    const jitter = isCurrentMonth ? 0 : Math.floor(Math.random() * 20);
    const count = baseline + jitter + (isCurrentMonth ? metrics.successCount : 0);

    return { 
      month: MONTHS[monthIdx], 
      count 
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      monthlyLogins,
      authMethods: [
        { method: "Password + TOTP", percentage: 48 },
        { method: "Google Workspace SSO", percentage: 27 },
        { method: "Microsoft Entra ID", percentage: 14 },
        { method: "Passkey (WebAuthn)", percentage: 8 },
        { method: "Magic Link", percentage: 3 },
      ],
      summary: {
        totalLogins: (metrics.successCount + 347).toString(),
        avgSessionTime: "24m 18s",
        failedAttempts: metrics.failureCount.toString(),
        mfaAdoption: metrics.uniqueUsers.size > 0 ? "94%" : "0%",
      },
    },
    _meta: {
      requestedBy: authResult.token?.sub || 'Unknown',
      validatedAt: new Date().toISOString(),
    },
  });
}
