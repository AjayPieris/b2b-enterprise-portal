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
    // Refresh real-time data every 5 seconds
    const interval = setInterval(fetchGatewayData, 5000);
    return () => clearInterval(interval);
  }, [getAccessToken]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthGuard requireAdmin={true}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">API Gateway Monitor</h1>
          <p className="text-purple-300/50 text-sm mt-1">
            Real-time API traffic analysis and performance metrics
          </p>
        </div>

        {/* Real-time stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-purple-300/60 uppercase tracking-wider mb-2">Total Requests (1h)</h3>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {data?.totalRequests || 0}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-purple-300/60 uppercase tracking-wider mb-2">Avg Latency</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {data?.avgLatency || 0}
              </p>
              <span className="text-purple-300/50 text-sm font-medium">ms</span>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-purple-300/60 uppercase tracking-wider mb-2">Error Rate</h3>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-bold bg-clip-text text-transparent ${
                parseFloat(data?.errorRate || "0") > 5 ? "bg-gradient-to-r from-red-400 to-pink-400" : "bg-gradient-to-r from-purple-400 to-pink-400"
              }`}>
                {data?.errorRate || "0.0"}
              </p>
              <span className="text-purple-300/50 text-sm font-medium">%</span>
            </div>
          </div>
        </div>

        {/* Live Traffic Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Live Traffic Feed</h2>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live
            </div>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-white/5">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-purple-300/50 uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Endpoint</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Latency</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentLogs?.length > 0 ? data.recentLogs.map((log: any, i: number) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-purple-200/70">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 font-mono text-purple-300">{log.endpoint}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        log.status >= 400 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-purple-200/70">{log.latency} ms</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-purple-300/40">
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
