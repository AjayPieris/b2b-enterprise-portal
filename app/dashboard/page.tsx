"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import StatsCard from "../components/StatsCard";
import {
  mockDashboardStats,
  mockRevenueData,
  mockRecentActivity,
  mockUptimeData,
  mockOrgDistribution,
  mockCompanies,
} from "../lib/mockData";

interface DashboardStats {
  stats?: {
    totalUsers?: string | number;
    activeSessions?: string | number;
    systemHealth?: string;
    apiRequests?: string | number;
  };
  recentAlerts?: {
    type: "info" | "warning" | "error";
    message: string;
    time: string;
  }[];
}

const activityIcons: Record<string, React.ReactNode> = {
  admin: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  security: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  integration: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  system: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  audit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const activityColors: Record<string, { bg: string; color: string }> = {
  admin: { bg: "rgba(59,130,246,0.08)", color: "#3b82f6" },
  security: { bg: "rgba(220,38,38,0.08)", color: "#dc2626" },
  integration: { bg: "rgba(34,197,94,0.08)", color: "#16a34a" },
  system: { bg: "rgba(212,168,67,0.08)", color: "#d4a843" },
  audit: { bg: "rgba(139,92,246,0.08)", color: "#8b5cf6" },
};

export default function DashboardOverview() {
  const { getAccessToken } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getAccessToken();

        const response = await fetch("/api/admin-data", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: "rgba(212,168,67,0.2)", borderTopColor: "#d4a843" }}
        />
      </div>
    );
  }

  const maxRevenue = Math.max(...mockRevenueData.map(d => d.revenue));

  return (
    <div className="space-y-8 animate-[fadeInUp_0.4s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Real-time enterprise metrics from secured API endpoints
        </p>
      </div>

      {/* ─── Primary Stats Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={String(stats?.stats?.totalUsers ?? mockDashboardStats.totalUsers)}
          change="+12.4% this month"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Sessions"
          value={String(stats?.stats?.activeSessions ?? mockDashboardStats.activeSessions)}
          change="Currently tracked"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title="API Requests"
          value={String(stats?.stats?.apiRequests ?? mockDashboardStats.apiRequests)}
          change="Avg 42ms response"
          changeType="neutral"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatsCard
          title="System Health"
          value={String(stats?.stats?.systemHealth ?? mockDashboardStats.systemHealth)}
          change="99.98% uptime"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          }
        />
      </div>

      {/* ─── Revenue Chart + Organization Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Revenue Growth</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Monthly recurring revenue across all tenants</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: "#16a34a" }}>$132.9K</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.15)" }}>
                ↑ 12.2%
              </span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-44">
            {mockRevenueData.map((item, i) => {
              const height = (item.revenue / maxRevenue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                    ${(item.revenue / 1000).toFixed(1)}K
                  </span>
                  <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: "140px", background: "rgba(0,0,0,0.02)" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ease-out group-hover:opacity-90"
                      style={{
                        height: `${height}%`,
                        background: i === mockRevenueData.length - 1
                          ? "linear-gradient(to top, #16a34a, #4ade80)"
                          : "linear-gradient(to top, #d4a843, #f0d98c)",
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Organization Breakdown */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Organizations</h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>Active tenant distribution</p>

          <div className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--text-muted)" }}>By Plan</p>
              {Object.entries(mockOrgDistribution.byPlan).map(([plan, count]) => {
                const total = Object.values(mockOrgDistribution.byPlan).reduce((a, b) => a + b, 0);
                const pct = (count / total) * 100;
                const colors: Record<string, string> = { Enterprise: "#d4a843", Business: "#3b82f6", Startup: "#16a34a" };
                return (
                  <div key={plan} className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium w-20" style={{ color: "var(--text-secondary)" }}>{plan}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: colors[plan] || "#d4a843" }} />
                    </div>
                    <span className="text-xs font-bold w-5 text-right" style={{ color: "var(--text-primary)" }}>{count}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "var(--text-muted)" }}>By Region</p>
              {Object.entries(mockOrgDistribution.byRegion).map(([region, count]) => {
                const total = Object.values(mockOrgDistribution.byRegion).reduce((a, b) => a + b, 0);
                const pct = (count / total) * 100;
                return (
                  <div key={region} className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium w-24" style={{ color: "var(--text-secondary)" }}>{region}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: "linear-gradient(to right, #d4a843, #f0d98c)" }} />
                    </div>
                    <span className="text-xs font-bold w-5 text-right" style={{ color: "var(--text-primary)" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Activity + Service Status ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div
          className="lg:col-span-2 rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
            <a href="/dashboard/audit-logs" className="text-xs font-medium hover:underline" style={{ color: "#b8922e" }}>
              View all →
            </a>
          </div>
          <div className="space-y-1">
            {mockRecentActivity.map((item) => {
              const colors = activityColors[item.type] || activityColors.system;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 transition-colors rounded-xl px-3 hover:bg-black/[0.01]"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.bg, color: colors.color }}
                  >
                    {activityIcons[item.type] || activityIcons.system}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.action}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {item.actor} → {item.target}
                    </p>
                  </div>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Status */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Service Status</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#16a34a" }}>All Operational</span>
            </div>
          </div>
          <div className="space-y-3">
            {mockUptimeData.map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors hover:bg-black/[0.01]"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#16a34a", boxShadow: "0 0 6px rgba(22,163,106,0.4)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{service.service}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>{service.uptime}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Top Organizations Mini Table ─── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Top Organizations</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Highest active user count across tenants</p>
          </div>
          <a href="/dashboard/companies" className="text-xs font-medium hover:underline" style={{ color: "#b8922e" }}>
            Manage all →
          </a>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.01)" }}>
              <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Organization</th>
              <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Industry</th>
              <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Users</th>
              <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>API Calls</th>
              <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Compliance</th>
              <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Plan</th>
            </tr>
          </thead>
          <tbody>
            {mockCompanies.slice(0, 5).map((company) => {
              const planColors: Record<string, { bg: string; color: string; border: string }> = {
                Enterprise: { bg: "rgba(212,168,67,0.1)", color: "#b8922e", border: "rgba(212,168,67,0.2)" },
                Business: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.2)" },
                Startup: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.2)" },
              };
              const plan = planColors[company.plan] || planColors.Startup;
              const complianceColor = company.complianceScore >= 95 ? "#16a34a" : company.complianceScore >= 85 ? "#d4a843" : "#dc2626";

              return (
                <tr
                  key={company.id}
                  className="hover:bg-gray-50/50 transition-colors"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: "linear-gradient(135deg, #d4a843, #b8922e)", boxShadow: "0 2px 6px rgba(212,168,67,0.25)" }}
                      >
                        {company.logo}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{company.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{company.domain}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary)" }}>{company.industry}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{company.userCount}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>/ {company.userLimit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {company.apiCallsToday.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-full rounded-full" style={{ width: `${company.complianceScore}%`, background: complianceColor }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: complianceColor }}>{company.complianceScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: plan.bg, color: plan.color, border: `1px solid ${plan.border}` }}>
                      {company.plan}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
