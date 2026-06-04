"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import AuthGuard from "../../components/AuthGuard";

export default function ApiGatewayPage() {
  const { getAccessToken } = useAuthContext();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchGatewayData = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/gateway", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch gateway data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayData();
    const interval = setInterval(fetchGatewayData, 5000);
    return () => clearInterval(interval);
  }, [getAccessToken]);

  if (loading && !data) {
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
    <AuthGuard requireAdmin={true}>
      <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>API Gateway Monitor</h1>
          <p className="text-sm mt-1" style={{ color: "#9e9e9e" }}>
            Real-time API traffic analysis and performance metrics
          </p>
        </div>

        {/* Analytics stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">Total Requests (1h)</h3>
            <p className="text-4xl font-bold text-blue-600">
              {data?.totalRequests || 0}
            </p>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">Avg Latency</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-emerald-600">
                {data?.avgLatency || 0}
              </p>
              <span className="text-sm font-medium text-gray-400">ms</span>
            </div>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 text-gray-400">Error Rate</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold" style={{
                color: parseFloat(data?.errorRate || "0") > 5 ? "#dc2626" : "#b8922e"
              }}>
                {data?.errorRate || "0.0"}
              </p>
              <span className="text-sm font-medium text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* Live Traffic */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold" style={{ color: "#1a1a1a" }}>Live Traffic Feed</h2>
            <div
              className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{
                color: "#16a34a",
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Connected
            </div>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Endpoint</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Latency</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentLogs?.length > 0 ? data.recentLogs.map((log: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 font-mono text-gray-900">{log.endpoint}</td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-1 rounded-md text-xs font-semibold"
                        style={{
                          background: log.status >= 400 ? "rgba(220,38,38,0.06)" : "rgba(34,197,94,0.06)",
                          color: log.status >= 400 ? "#dc2626" : "#16a34a",
                          border: `1px solid ${log.status >= 400 ? "rgba(220,38,38,0.15)" : "rgba(34,197,94,0.15)"}`,
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{log.latency} ms</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No API traffic detected yet. 
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
