"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import StatsCard from "../components/StatsCard";

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Real-time enterprise metrics from secured API endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={String(stats?.stats?.totalUsers ?? "0")}
          change="Real-time SCIM2 Data"
          changeType="neutral"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Sessions"
          value={String(stats?.stats?.activeSessions ?? "0")}
          change="Currently Tracked"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title="System Health"
          value={String(stats?.stats?.systemHealth ?? "Unknown")}
          change="100% uptime"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          }
        />
        <StatsCard
          title="API Requests"
          value={String(stats?.stats?.apiRequests ?? "Live")}
          change="Go to Gateway Monitor"
          changeType="neutral"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
        <div className="space-y-4">
          {stats?.recentAlerts?.map((item: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 last:border-0"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${
                item.type === "info" ? "bg-emerald-400" :
                item.type === "warning" ? "bg-amber-400" :
                "bg-blue-400"
              }`} style={{
                boxShadow: item.type === "info" ? "0 0 6px rgba(52,211,153,0.4)" :
                           item.type === "warning" ? "0 0 6px rgba(251,191,36,0.4)" :
                           "0 0 6px rgba(96,165,250,0.4)"
              }} />
              <p className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{item.message}</p>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(item.time).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
