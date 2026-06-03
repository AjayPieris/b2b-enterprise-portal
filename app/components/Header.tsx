"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useRef, useState } from "react";
import type { TriggeredAlert } from "../lib/alertRules";

const severityColor: Record<string, string> = {
  low: "text-blue-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const severityBg: Record<string, string> = {
  low: "bg-blue-500/10 border-blue-500/20",
  medium: "bg-amber-500/10 border-amber-500/20",
  high: "bg-orange-500/10 border-orange-500/20",
  critical: "bg-red-500/10 border-red-500/20",
};

export default function Header() {
  const { state, getBasicUserInfo, getAccessToken } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);

  // notification bell state
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.isAuthenticated) {
      getBasicUserInfo().then((info) => {
        const roles = info?.groups || info?.roles || "";
        const adminCheck = Array.isArray(roles)
          ? roles.some((r: string) => r?.toLowerCase()?.includes("admin"))
          : typeof roles === "string" && roles.toLowerCase().includes("admin");
        setIsAdmin(adminCheck);
      });
    }
  }, [state.isAuthenticated, getBasicUserInfo]);

  // poll /api/alerts every 10 seconds
  useEffect(() => {
    if (!state.isAuthenticated) return;

    async function fetchAlerts() {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts);
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // silently fail — bell just won't update
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, getAccessToken]);

  // close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function openPanel() {
    setPanelOpen((prev) => !prev);

    // mark all as read when the panel is opened
    if (!panelOpen && unreadCount > 0) {
      try {
        const token = await getAccessToken();
        await fetch("/api/alerts", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ all: true }),
        });
        setUnreadCount(0);
        setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      } catch {
        // ignore
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8">
      <div>
        <h2 className="text-white font-semibold text-lg">
          Welcome back, <span className="text-purple-400">{state.username || "User"}</span>
        </h2>
        <p className="text-purple-300/50 text-xs">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={openPanel}
            className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {panelOpen && (
            <div className="absolute right-0 top-11 w-80 bg-[#0f0f1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Security Alerts</span>
                <span className="text-[10px] text-purple-400/60 uppercase tracking-wider">
                  {alerts.length} total
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-2xl mb-2">🛡️</p>
                    <p className="text-purple-300/50 text-xs">No alerts — all clear</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`px-4 py-3 border-l-2 ${alert.read ? "border-white/10 opacity-60" : "border-red-500"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${severityBg[alert.severity]} ${severityColor[alert.severity]}`}>
                          {alert.severity}
                        </div>
                        <span className="text-[10px] text-purple-400/40 flex-shrink-0">
                          {new Date(alert.triggeredAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white mt-1">{alert.ruleName}</p>
                      <p className="text-[11px] text-purple-300/60 mt-0.5 leading-relaxed">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>

              {alerts.length > 0 && (
                <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02]">
                  <a href="/dashboard/audit-logs" className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors">
                    View full audit log →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
            isAdmin
              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
              : "bg-purple-500/15 text-purple-400 border-purple-500/30"
          }`}
        >
          {isAdmin ? "⚡ Admin" : "👤 Member"}
        </span>

        {/* Identity provider badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400/80 text-[10px] font-semibold uppercase tracking-wider">
            Asgardeo Connected
          </span>
        </div>
      </div>
    </header>
  );
}
