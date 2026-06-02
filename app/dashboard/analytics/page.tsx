"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";

interface AnalyticsData {
  monthlyLogins: { month: string; count: number }[];
  authMethods: { method: string; percentage: number }[];
  summary: {
    totalLogins: string;
    avgSessionTime: string;
    failedAttempts: string;
    mfaAdoption: string;
  };
}

export default function AnalyticsPage() {
  const { getAccessToken } = useAuthContext();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const token = await getAccessToken();

        const response = await fetch("/api/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  const maxCount = Math.max(...(data?.monthlyLogins?.map((m) => m.count) || [1]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-purple-300/50 text-sm mt-1">
          Authentication metrics and usage insights from Asgardeo
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Logins", value: data?.summary?.totalLogins, color: "from-purple-500 to-indigo-500" },
          { label: "Avg Session", value: data?.summary?.avgSessionTime, color: "from-blue-500 to-cyan-500" },
          { label: "Failed Attempts", value: data?.summary?.failedAttempts, color: "from-red-500 to-pink-500" },
          { label: "MFA Adoption", value: data?.summary?.mfaAdoption, color: "from-emerald-500 to-teal-500" },
        ].map((card, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
            <p className="text-purple-300/50 text-xs font-semibold uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart — Monthly logins */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Monthly Logins</h2>
        <div className="flex items-end gap-4 h-48">
          {data?.monthlyLogins?.map((month, i: number) => {
            const height = (month.count / maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-purple-300/60 font-medium">{month.count}</span>
                <div className="w-full relative rounded-t-lg overflow-hidden bg-white/5" style={{ height: "160px" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-indigo-500 transition-all duration-700"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-purple-300/50 font-medium">{month.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auth methods breakdown */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Authentication Methods</h2>
        <div className="space-y-5">
          {data?.authMethods?.map((method, i: number) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-purple-200/80">{method.method}</span>
                <span className="text-sm font-semibold text-purple-400">{method.percentage}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    i === 0 ? "bg-gradient-to-r from-purple-500 to-indigo-500" :
                    i === 1 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                    "bg-gradient-to-r from-amber-500 to-orange-500"
                  }`}
                  style={{ width: `${method.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

