"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useRef, useState, useCallback } from "react";
import type { TriggeredAlert } from "../lib/alertRules";

const severityColors: Record<string, string> = {
  low: "#3b82f6",
  medium: "#d4a843",
  high: "#ea580c",
  critical: "#dc2626",
};

const severityStyles: Record<string, React.CSSProperties> = {
  low: { background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" },
  medium: { background: "rgba(212,168,67,0.08)", color: "#b8922e", border: "1px solid rgba(212,168,67,0.2)" },
  high: { background: "rgba(234,88,12,0.08)", color: "#ea580c", border: "1px solid rgba(234,88,12,0.2)" },
  critical: { background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" },
};

const resolvedBadgeStyles: Record<string, React.CSSProperties> = {
  deleted: { background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" },
  allowed: { background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.15)" },
  dismissed: { background: "rgba(0,0,0,0.04)", color: "#9e9e9e", border: "1px solid rgba(0,0,0,0.08)" },
};

const resolvedLabels: Record<string, string> = {
  deleted: "✓ User deleted",
  allowed: "✓ Login allowed",
  dismissed: "Dismissed",
};

type ActionState = "idle" | "loading" | "done" | "error";

export default function Header() {
  const { state, getBasicUserInfo, getAccessToken } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);

  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

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

  const fetchAlerts = useCallback(async () => {
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
      // ignore fetching failures silently (e.g. session timeout)
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!state.isAuthenticated || !isAdmin) return;
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, isAdmin, fetchAlerts]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openPanel = async () => {
    setPanelOpen((prev) => !prev);

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
      } catch (err) {
        console.error("Failed to mark alerts as read", err);
      }
    }
  };

  const handleUserAction = async (alert: TriggeredAlert, action: "delete" | "allow") => {
    if (!alert.subjectUser) return;

    setActionStates((s) => ({ ...s, [alert.id]: "loading" }));
    setActionErrors((s) => ({ ...s, [alert.id]: "" }));

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          username: alert.subjectUser,
          alertId: alert.id,
        }),
      });

      if (res.ok) {
        setActionStates((s) => ({ ...s, [alert.id]: "done" }));
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id
              ? {
                  ...a,
                  resolved: true,
                  read: true,
                  resolvedAction: action === "delete" ? "deleted" : "allowed",
                }
              : a
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        setTimeout(fetchAlerts, 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionStates((s) => ({ ...s, [alert.id]: "error" }));
        setActionErrors((s) => ({
          ...s,
          [alert.id]: data.error || `Action failed (${res.status})`,
        }));
      }
    } catch (e) {
      setActionStates((s) => ({ ...s, [alert.id]: "error" }));
      setActionErrors((s) => ({
        ...s,
        [alert.id]: "Network connection error.",
      }));
    }
  };

  function AlertCard({ alert }: { alert: TriggeredAlert }) {
    const aState = actionStates[alert.id] ?? "idle";
    const aErr = actionErrors[alert.id] ?? "";
    const isLoginFailure = alert.actionType === "login_failure" && !!alert.subjectUser;
    const isLoading = aState === "loading";

    return (
      <div
        className="px-4 py-3 transition-opacity"
        style={{
          borderLeft: `3px solid ${
            alert.resolved
              ? "rgba(0,0,0,0.06)"
              : alert.read
              ? "rgba(0,0,0,0.08)"
              : severityColors[alert.severity] || "#dc2626"
          }`,
          opacity: alert.resolved ? 0.5 : alert.read ? 0.75 : 1,
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div
            className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={severityStyles[alert.severity]}
          >
            {alert.severity}
          </div>
          <span className="text-[10px] flex-shrink-0 text-gray-400">
            {new Date(alert.triggeredAt).toLocaleTimeString()}
          </span>
        </div>

        <p className="text-xs font-semibold text-gray-900">{alert.ruleName}</p>
        <p className="text-[11px] mt-0.5 leading-relaxed text-gray-500">
          {alert.message}
        </p>

        {isAdmin && isLoginFailure && !alert.resolved && (
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => handleUserAction(alert, "delete")}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
              style={{
                background: "rgba(220,38,38,0.06)",
                color: "#dc2626",
                border: "1px solid rgba(220,38,38,0.15)",
              }}
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Delete User
            </button>

            <button
              onClick={() => handleUserAction(alert, "allow")}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50"
              style={{
                background: "rgba(34,197,94,0.06)",
                color: "#16a34a",
                border: "1px solid rgba(34,197,94,0.15)",
              }}
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              Allow Login
            </button>
          </div>
        )}

        {alert.resolved && alert.resolvedAction && (
          <div className="mt-2">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={resolvedBadgeStyles[alert.resolvedAction]}
            >
              {resolvedLabels[alert.resolvedAction]}
            </span>
          </div>
        )}

        {aErr && (
          <p className="mt-1.5 text-[10px] text-red-600">{aErr}</p>
        )}
      </div>
    );
  }

  return (
    <header
      className="sticky top-0 z-40 h-16 flex items-center justify-between px-8"
      style={{
        background: "rgba(245, 240, 232, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div>
        <h2 className="font-semibold text-lg text-gray-900">
          Welcome back, <span style={{ color: "#b8922e" }}>{state.username || "User"}</span>
        </h2>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Alerts Center — only visible to admins */}
        {isAdmin && (
        <div className="relative" ref={panelRef}>
          <button
            id="notification-bell-btn"
            onClick={openPanel}
            aria-label="Open security alerts"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{
              background: "rgba(0,0,0,0.04)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
                style={{ background: "#dc2626" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Alerts panel dropdown */}
          {panelOpen && (
            <div
              className="absolute right-0 top-11 w-[22rem] overflow-hidden z-50 animate-[fadeInUp_0.2s_ease-out]"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "16px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
              }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">Security Alerts</span>
                  {isAdmin && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(212,168,67,0.12)",
                        color: "#b8922e",
                        border: "1px solid rgba(212,168,67,0.2)",
                      }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400">
                  {alerts.filter((a) => !a.resolved).length} active
                </span>
              </div>

              <div className="max-h-[22rem] overflow-y-auto" style={{ borderTop: "none" }}>
                {alerts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-2xl mb-2">🛡️</p>
                    <p className="text-xs text-gray-400">No alerts — all clear</p>
                  </div>
                ) : (
                  alerts.map((alert, index) => (
                    <div key={alert.id} style={{ borderTop: index > 0 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                      <AlertCard alert={alert} />
                    </div>
                  ))
                )}
              </div>

              {alerts.length > 0 && (
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{
                    borderTop: "1px solid rgba(0,0,0,0.06)",
                    background: "rgba(0,0,0,0.02)",
                  }}
                >
                  <a
                    href="/dashboard/audit-logs"
                    className="text-[11px] hover:underline"
                    style={{ color: "#b8922e" }}
                  >
                    View audit trail &rarr;
                  </a>
                  {isAdmin && (
                    <span className="text-[10px] text-gray-400">
                      Admin controls enabled
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Identity Role */}
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
          style={{
            background: isAdmin ? "rgba(212,168,67,0.1)" : "rgba(0,0,0,0.04)",
            color: isAdmin ? "#b8922e" : "#6b6b6b",
            border: `1px solid ${isAdmin ? "rgba(212,168,67,0.2)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          {isAdmin ? "⚡ Admin" : "👤 Member"}
        </span>

        {/* Provider Connectivity */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            Asgardeo Connected
          </span>
        </div>
      </div>
    </header>
  );
}
