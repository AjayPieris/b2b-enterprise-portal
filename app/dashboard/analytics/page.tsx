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

const summaryColors = [
  { light: 'rgba(212,168,67,0.08)', text: '#b8922e' },
  { light: 'rgba(59,130,246,0.08)', text: '#3b82f6' },
  { light: 'rgba(220,38,38,0.08)', text: '#dc2626' },
  { light: 'rgba(34,197,94,0.08)', text: '#16a34a' },
];

const barColors = [
  'linear-gradient(to top, #d4a843, #f0d98c)',
  'linear-gradient(to top, #3b82f6, #93c5fd)',
  'linear-gradient(to top, #f59e0b, #fcd34d)',
];

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
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: 'rgba(212,168,67,0.2)', borderTopColor: '#d4a843' }}
        />
      </div>
    );
  }

  const maxCount = Math.max(...(data?.monthlyLogins?.map((m) => m.count) || [1]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: '#9e9e9e' }}>
          Authentication metrics and usage insights from Asgardeo
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Logins", value: data?.summary?.totalLogins },
          { label: "Avg Session", value: data?.summary?.avgSessionTime },
          { label: "Failed Attempts", value: data?.summary?.failedAttempts },
          { label: "MFA Adoption", value: data?.summary?.mfaAdoption },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-xl p-5"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9e9e9e' }}>
              {card.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: summaryColors[i].text }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart — Monthly logins */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h2 className="text-lg font-semibold mb-6" style={{ color: '#1a1a1a' }}>Monthly Logins</h2>
        <div className="flex items-end gap-4 h-48">
          {data?.monthlyLogins?.map((month, i: number) => {
            const height = (month.count / maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>{month.count}</span>
                <div
                  className="w-full relative rounded-t-lg overflow-hidden"
                  style={{ height: '160px', background: 'rgba(0,0,0,0.03)' }}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700"
                    style={{
                      height: `${height}%`,
                      background: 'linear-gradient(to top, #d4a843, #f0d98c)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: '#9e9e9e' }}>{month.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auth methods breakdown */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h2 className="text-lg font-semibold mb-6" style={{ color: '#1a1a1a' }}>Authentication Methods</h2>
        <div className="space-y-5">
          {data?.authMethods?.map((method, i: number) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <span className="text-sm" style={{ color: '#4b4b4b' }}>{method.method}</span>
                <span className="text-sm font-semibold" style={{ color: '#b8922e' }}>{method.percentage}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${method.percentage}%`,
                    background: i === 0
                      ? 'linear-gradient(to right, #d4a843, #f0d98c)'
                      : i === 1
                      ? 'linear-gradient(to right, #3b82f6, #93c5fd)'
                      : 'linear-gradient(to right, #f59e0b, #fcd34d)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

