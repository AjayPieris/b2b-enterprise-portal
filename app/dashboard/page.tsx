"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import StatsCard from "../components/StatsCard";

export default function DashboardOverview() {
  const { getAccessToken } = useAuthContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch enterprise data from our protected API using Asgardeo access token
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
        <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-purple-300/50 text-sm mt-1">
          Real-time enterprise metrics from secured API endpoints
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Billing"
          value={stats?.totalBilling || "$0"}
          change="12% from last month"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Users"
          value={stats?.activeUsers?.toString() || "0"}
          change="8 new this week"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Server Status"
          value={stats?.serverStatus || "Unknown"}
          change="99.9% uptime"
          changeType="up"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          }
        />
        <StatsCard
          title="API Requests"
          value="24.5K"
          change="3.2K today"
          changeType="neutral"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Recent Activity section */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { action: "User authenticated via Asgardeo", time: "2 min ago", type: "auth" },
            { action: "Admin accessed billing data", time: "15 min ago", type: "admin" },
            { action: "New team member invited", time: "1 hour ago", type: "team" },
            { action: "API rate limit updated", time: "3 hours ago", type: "settings" },
            { action: "Monthly report generated", time: "1 day ago", type: "report" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0"
            >
              <div className={`w-2 h-2 rounded-full ${
                item.type === "auth" ? "bg-emerald-400" :
                item.type === "admin" ? "bg-amber-400" :
                item.type === "team" ? "bg-blue-400" :
                "bg-purple-400"
              }`} />
              <p className="text-sm text-purple-200/80 flex-1">{item.action}</p>
              <span className="text-xs text-purple-400/40">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
