"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useRef, useState, useCallback } from "react";
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

const resolvedBadge: Record<string, string> = {
  deleted: "bg-red-500/20 text-red-300 border-red-500/30",
  allowed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  dismissed: "bg-white/10 text-purple-400 border-white/20",
};

const resolvedLabel: Record<string, string> = {
  deleted: "✓ User deleted",
  allowed: "✓ Login allowed",
  dismissed: "Dismissed",
};

// ── Per-alert action state ─────────────────────────────────────────────────
type ActionState = "idle" | "loading" | "done" | "error";

export default function Header() {
  const { state, getBasicUserInfo, getAccessToken } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);

  // notification bell state
  const [alerts, setAlerts] = useState<TriggeredAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // per-alert action loading states
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  // ── Check if current user is admin ──────────────────────────────────────
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

  // ── Poll /api/alerts every 10 s ─────────────────────────────────────────
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
      // silently fail — bell just won't update
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [state.isAuthenticated, fetchAlerts]);

  // ── Close panel on outside click ────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Open panel + mark all read ───────────────────────────────────────────
  async function openPanel() {
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
      } catch {
        // ignore
      }
    }
  }

  // ── Admin action: delete or allow user ──────────────────────────────────
  async function handleUserAction(
    alert: TriggeredAlert,
    action: "delete" | "allow"
  ) {
    if (!alert.subjectUser) return;

    const key = `${alert.id}_${action}`;
    setActionStates((s) => ({ ...s, [alert.id]: "loading" }));
    setActionError((s) => ({ ...s, [alert.id]: "" }));

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
        // Optimistically update local state so UI reflects resolved status
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
        // Re-fetch after a short delay so server state is in sync
        setTimeout(fetchAlerts, 1200);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionStates((s) => ({ ...s, [alert.id]: "error" }));
        setActionError((s) => ({
          ...s,
          [alert.id]: data.error || `Action failed (${res.status})`,
        }));
      }
    } catch (e) {
      setActionStates((s) => ({ ...s, [alert.id]: "error" }));
      setActionError((s) => ({
        ...s,
        [alert.id]: "Network error. Try again.",
      }));
    }
    // suppress unused 'key' warning
    void key;
  }

  // ── Render an individual alert card ─────────────────────────────────────
  function AlertCard({ alert }: { alert: TriggeredAlert }) {
    const aState = actionStates[alert.id] ?? "idle";
    const aErr = actionError[alert.id] ?? "";
    const isLoginFailure = alert.actionType === "login_failure" && !!alert.subjectUser;
    const isLoading = aState === "loading";

    return (
      <div
        className={`px-4 py-3 border-l-2 transition-opacity ${
          alert.resolved
            ? "border-white/10 opacity-50"
            : alert.read
            ? "border-white/10 opacity-70"
            : "border-red-500"
        }`}
      >
        {/* Header row: severity badge + time */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              severityBg[alert.severity]
            } ${severityColor[alert.severity]}`}
          >
            {alert.severity}
          </div>
          <span className="text-[10px] text-purple-400/40 flex-shrink-0">
            {new Date(alert.triggeredAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Rule name + message */}
        <p className="text-xs font-semibold text-white">{alert.ruleName}</p>
        <p className="text-[11px] text-purple-300/60 mt-0.5 leading-relaxed">
          {alert.message}
        </p>

        {/* ── Admin action buttons (login failure alerts only) ────────── */}
        {isAdmin && isLoginFailure && !alert.resolved && (
          <div className="mt-2.5 flex gap-2">
            {/* Delete user */}
            <button
              onClick={() => handleUserAction(alert, "delete")}
              disabled={isLoading}
              title={`Permanently delete ${alert.subjectUser} from Asgardeo`}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Delete User
            </button>

            {/* Allow login */}
            <button
              onClick={() => handleUserAction(alert, "allow")}
              disabled={isLoading}
              title={`Unlock / allow ${alert.subjectUser} to log in`}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 hover:text-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              Allow Login
            </button>
          </div>
        )}

        {/* ── Resolved badge ───────────────────────────────────────────── */}
        {alert.resolved && alert.resolvedAction && (
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                resolvedBadge[alert.resolvedAction]
              }`}
            >
              {resolvedLabel[alert.resolvedAction]}
            </span>
          </div>
        )}

        {/* ── Error feedback ───────────────────────────────────────────── */}
        {aErr && (
          <p className="mt-1.5 text-[10px] text-red-400/80">{aErr}</p>
        )}
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
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
        {/* ── Notification bell ─────────────────────────────────────── */}
        <div className="relative" ref={panelRef}>
          <button
            id="notification-bell-btn"
            onClick={openPanel}
            aria-label="Open security alerts"
            className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* ── Dropdown panel ──────────────────────────────────────── */}
          {panelOpen && (
            <div className="absolute right-0 top-11 w-[22rem] bg-[#0f0f1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              {/* Panel header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Security Alerts</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Admin
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-purple-400/60 uppercase tracking-wider">
                  {alerts.filter((a) => !a.resolved).length} active
                </span>
              </div>

              {/* Alert list */}
              <div className="max-h-[22rem] overflow-y-auto divide-y divide-white/5">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-2xl mb-2">🛡️</p>
                    <p className="text-purple-300/50 text-xs">No alerts — all clear</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))
                )}
              </div>

              {/* Footer */}
              {alerts.length > 0 && (
                <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                  <a
                    href="/dashboard/audit-logs"
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View full audit log →
                  </a>
                  {isAdmin && (
                    <span className="text-[10px] text-purple-400/40">
                      Admin actions enabled
                    </span>
                  )}
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
