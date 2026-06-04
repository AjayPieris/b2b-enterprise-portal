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
const typeConfig = {
  auth: { label: "Auth", dot: "#16a34a", bgStyle: { background: 'rgba(34,197,94,0.06)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.15)' } },
  admin: { label: "Admin", dot: "#d4a843", bgStyle: { background: 'rgba(212,168,67,0.08)', color: '#b8922e', border: '1px solid rgba(212,168,67,0.15)' } },
  system: { label: "System", dot: "#3b82f6", bgStyle: { background: 'rgba(59,130,246,0.06)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.15)' } },
  security: { label: "Security", dot: "#dc2626", bgStyle: { background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.15)' } },
};

const severityConfig = {
  info: { label: "Info", icon: "ℹ️", bgStyle: { background: 'rgba(59,130,246,0.06)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.15)' } },
  warning: { label: "Warning", icon: "⚠️", bgStyle: { background: 'rgba(212,168,67,0.08)', color: '#b8922e', border: '1px solid rgba(212,168,67,0.15)' } },
  critical: { label: "Critical", icon: "🚨", bgStyle: { background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.15)' } },
};

const summaryGradients = [
  { text: '#b8922e' },
  { text: '#dc2626' },
  { text: '#d4a843' },
  { text: '#ea580c' },
];

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

  // ── Loading state ───────────────────────────────────────────────────────
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

  return (
    <div className="space-y-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Audit Logs</h1>
          <p className="text-sm mt-1" style={{ color: '#9e9e9e' }}>
            Security and compliance event trail — tracked by Asgardeo IAM
          </p>
        </div>
        {/* Live indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.15)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#16a34a' }}>
            Live Monitoring
          </span>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Events" value={summary.total.toString()} colorIndex={0} />
          <SummaryCard label="Security Alerts" value={summary.byType.security.toString()} colorIndex={1} />
          <SummaryCard label="Warnings" value={summary.bySeverity.warning.toString()} colorIndex={2} />
          <SummaryCard label="Critical" value={summary.bySeverity.critical.toString()} colorIndex={3} />
        </div>
      )}

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-4"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9e9e9e' }}>
            Filter by:
          </span>

          {/* Type filters */}
          <div className="flex gap-2">
            <FilterChip label="All" active={typeFilter === null} onClick={() => setTypeFilter(null)} />
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
          <div className="w-px h-6" style={{ background: 'rgba(0,0,0,0.08)' }} />

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
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm" style={{ color: '#9e9e9e' }}>No events match your filters</p>
            </div>
          ) : (
            events.map((event) => {
              const isExpanded = expandedEvent === event.id;
              const tConfig = typeConfig[event.type];
              const sConfig = severityConfig[event.severity];

              return (
                <div
                  key={event.id}
                  className="px-6 py-4 cursor-pointer transition-all duration-200"
                  style={{
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    background: isExpanded ? 'rgba(0,0,0,0.02)' : 'transparent',
                  }}
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                >
                  {/* Main row */}
                  <div className="flex items-center gap-4">
                    {/* Severity dot */}
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tConfig.dot }} />

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-sm font-medium font-mono" style={{ color: '#1a1a1a' }}>
                          {event.action}
                        </code>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                          style={tConfig.bgStyle}
                        >
                          {tConfig.label}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                          style={sConfig.bgStyle}
                        >
                          {sConfig.label}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: '#6b6b6b' }}>{event.details}</p>
                    </div>

                    {/* Actor & time */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium" style={{ color: '#4b4b4b' }}>{event.actor}</p>
                      <p className="text-xs" style={{ color: '#9e9e9e' }}>{formatTime(event.timestamp)}</p>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      style={{ color: '#9e9e9e' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 ml-6.5 pl-4 space-y-2" style={{ borderLeft: '2px solid rgba(212,168,67,0.2)' }}>
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
function SummaryCard({ label, value, colorIndex }: { label: string; value: string; colorIndex: number }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9e9e9e' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: summaryGradients[colorIndex].text }}>
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
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
      style={{
        background: active ? 'rgba(212,168,67,0.1)' : 'rgba(0,0,0,0.03)',
        color: active ? '#b8922e' : '#6b6b6b',
        border: active ? '1px solid rgba(212,168,67,0.2)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {label}
    </button>
  );
}

/** A single label-value row in the expanded event details */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider w-24 flex-shrink-0" style={{ color: '#9e9e9e' }}>
        {label}
      </span>
      <span className="text-xs font-mono" style={{ color: '#4b4b4b' }}>{value}</span>
    </div>
  );
}
