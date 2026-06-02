/**
 * Audit Logs Page
 * 
 * ROUTE: /dashboard/audit-logs
 * PURPOSE: Enterprise compliance feature — shows all security and auth events
 * ACCESS: All authenticated users can view audit logs
 * 
 * FEATURES:
 * - Filter by event type (Auth, Admin, System, Security)
 * - Filter by severity (Info, Warning, Critical)
 * - Summary cards showing event distribution
 * - Color-coded severity badges
 * - Detailed event information with IP, user agent, and timestamp
 * 
 * WHY THIS MATTERS FOR ENTERPRISE:
 * SOC2, ISO 27001, and GDPR compliance require audit logging.
 * This page demonstrates that your system tracks all identity events.
 */

"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";

// ── Types (matching the API response) ─────────────────────────────────────
interface AuditEvent {
  id: string;
  timestamp: string;
  type: "auth" | "admin" | "system" | "security";
  severity: "info" | "warning" | "critical";
  action: string;
  actor: string;
  ip: string;
  userAgent: string;
  details: string;
}

interface AuditSummary {
  total: number;
  byType: { auth: number; admin: number; system: number; security: number };
  bySeverity: { info: number; warning: number; critical: number };
}

// ── Styling maps ──────────────────────────────────────────────────────────
// These map event types and severities to their visual styles

const typeConfig = {
  auth: { label: "Auth", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  admin: { label: "Admin", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  system: { label: "System", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  security: { label: "Security", color: "bg-red-500/15 text-red-400 border-red-500/20", dot: "bg-red-400" },
};

const severityConfig = {
  info: { label: "Info", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: "ℹ️" },
  warning: { label: "Warning", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: "⚠️" },
  critical: { label: "Critical", color: "bg-red-500/15 text-red-400 border-red-500/20", icon: "🚨" },
};

export default function AuditLogsPage() {
  const { getAccessToken } = useAuthContext();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Active filters — null means "show all"
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  // Track which event row is expanded to show full details
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // ── Fetch audit logs from our protected API ─────────────────────────────
  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        // Get the Asgardeo access token
        const token = await getAccessToken();

        // Build the URL with query parameters for filtering
        const params = new URLSearchParams();
        if (typeFilter) params.set("type", typeFilter);
        if (severityFilter) params.set("severity", severityFilter);

        const response = await fetch(`/api/audit-logs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setEvents(result.data);
          setSummary(result.summary);
        }
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLogs();
  }, [getAccessToken, typeFilter, severityFilter]); // Re-fetch when filters change

  // ── Format timestamp to human-readable relative time ────────────────────
  function formatTime(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-purple-300/50 text-sm mt-1">
            Security and compliance event trail — tracked by Asgardeo IAM
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400/80 text-[10px] font-semibold uppercase tracking-wider">
            Live Monitoring
          </span>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Events"
            value={summary.total.toString()}
            gradient="from-purple-500 to-indigo-500"
          />
          <SummaryCard
            label="Security Alerts"
            value={summary.byType.security.toString()}
            gradient="from-red-500 to-pink-500"
          />
          <SummaryCard
            label="Warnings"
            value={summary.bySeverity.warning.toString()}
            gradient="from-amber-500 to-orange-500"
          />
          <SummaryCard
            label="Critical"
            value={summary.bySeverity.critical.toString()}
            gradient="from-red-600 to-red-400"
          />
        </div>
      )}

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-purple-300/60 text-xs font-semibold uppercase tracking-wider">
            Filter by:
          </span>

          {/* Type filters */}
          <div className="flex gap-2">
            <FilterChip
              label="All"
              active={typeFilter === null}
              onClick={() => setTypeFilter(null)}
            />
            {(Object.entries(typeConfig) as [string, { label: string }][]).map(([key, cfg]) => (
              <FilterChip
                key={key}
                label={cfg.label}
                active={typeFilter === key}
                onClick={() => setTypeFilter(typeFilter === key ? null : key)}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Severity filters */}
          <div className="flex gap-2">
            {(Object.entries(severityConfig) as [string, { label: string; icon: string }][]).map(([key, cfg]) => (
              <FilterChip
                key={key}
                label={`${cfg.icon} ${cfg.label}`}
                active={severityFilter === key}
                onClick={() => setSeverityFilter(severityFilter === key ? null : key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Event List ───────────────────────────────────────────────────── */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/5">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-purple-300/50 text-sm">No events match your filters</p>
            </div>
          ) : (
            events.map((event) => {
              const isExpanded = expandedEvent === event.id;
              const tConfig = typeConfig[event.type];
              const sConfig = severityConfig[event.severity];

              return (
                <div
                  key={event.id}
                  className={`px-6 py-4 cursor-pointer transition-all duration-200 ${
                    isExpanded ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                  }`}
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4">
                    {/* Severity dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tConfig.dot}`} />

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-sm text-white font-medium font-mono">
                          {event.action}
                        </code>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${tConfig.color}`}>
                          {tConfig.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${sConfig.color}`}>
                          {sConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-purple-300/60 truncate">{event.details}</p>
                    </div>

                    {/* Actor & time */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-purple-200/70 font-medium">{event.actor}</p>
                      <p className="text-xs text-purple-400/40">{formatTime(event.timestamp)}</p>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      className={`w-4 h-4 text-purple-400/40 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 ml-6.5 pl-4 border-l-2 border-purple-500/20 space-y-2">
                      <DetailRow label="Timestamp" value={new Date(event.timestamp).toLocaleString()} />
                      <DetailRow label="Actor" value={event.actor} />
                      <DetailRow label="IP Address" value={event.ip} />
                      <DetailRow label="User Agent" value={event.userAgent} />
                      <DetailRow label="Details" value={event.details} />
                      <DetailRow label="Event ID" value={event.id} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────

/** Summary card showing a single stat */
function SummaryCard({ label, value, gradient }: { label: string; value: string; gradient: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
      <p className="text-purple-300/50 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
        {value}
      </p>
    </div>
  );
}

/** Clickable filter chip */
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
        active
          ? "bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/10"
          : "bg-white/5 text-purple-300/50 border-white/10 hover:bg-white/10 hover:text-purple-300"
      }`}
    >
      {label}
    </button>
  );
}

/** A single label-value row in the expanded event details */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs text-purple-300/40 font-semibold uppercase tracking-wider w-24 flex-shrink-0">
        {label}
      </span>
      <span className="text-xs text-purple-200/70 font-mono">{value}</span>
    </div>
  );
}
