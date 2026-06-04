"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";

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

const typeConfig = {
  auth: { label: "Auth", dot: "#16a34a", bgStyle: { background: "rgba(34,197,94,0.06)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.15)" } },
  admin: { label: "Admin", dot: "#d4a843", bgStyle: { background: "rgba(212,168,67,0.08)", color: "#b8922e", border: "1px solid rgba(212,168,67,0.15)" } },
  system: { label: "System", dot: "#3b82f6", bgStyle: { background: "rgba(59,130,246,0.06)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.15)" } },
  security: { label: "Security", dot: "#dc2626", bgStyle: { background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" } },
};

const severityConfig = {
  info: { label: "Info", icon: "ℹ️", bgStyle: { background: "rgba(59,130,246,0.06)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.15)" } },
  warning: { label: "Warning", icon: "⚠️", bgStyle: { background: "rgba(212,168,67,0.08)", color: "#b8922e", border: "1px solid rgba(212,168,67,0.15)" } },
  critical: { label: "Critical", icon: "🚨", bgStyle: { background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" } },
};

const summaryGradients = [
  { text: "#b8922e" },
  { text: "#dc2626" },
  { text: "#d4a843" },
  { text: "#ea580c" },
];

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

  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const token = await getAccessToken();
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
  }, [getAccessToken, typeFilter, severityFilter]);

  if (loading) {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Audit Trail</h1>
          <p className="text-sm mt-1" style={{ color: "#9e9e9e" }}>
            Immutable security log of login attempts, settings updates, and webhook actions.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#16a34a" }}>
            Live Feed
          </span>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-[fadeInUp_0.3s_ease-out]">
          <SummaryCard label="Total Events" value={summary.total.toString()} colorIndex={0} />
          <SummaryCard label="Security Warnings" value={summary.byType.security.toString()} colorIndex={1} />
          <SummaryCard label="Warnings" value={summary.bySeverity.warning.toString()} colorIndex={2} />
          <SummaryCard label="Critical Incidents" value={summary.bySeverity.critical.toString()} colorIndex={3} />
        </div>
      )}

      {/* Filter toolbar */}
      <div
        className="rounded-xl p-4 animate-[fadeInUp_0.4s_ease-out]"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Filters:
          </span>

          <div className="flex gap-2">
            <FilterChip label="All Events" active={typeFilter === null} onClick={() => setTypeFilter(null)} />
            {(Object.entries(typeConfig) as [string, { label: string }][]).map(([key, cfg]) => (
              <FilterChip
                key={key}
                label={cfg.label}
                active={typeFilter === key}
                onClick={() => setTypeFilter(typeFilter === key ? null : key)}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200" />

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

      {/* Audit list */}
      <div
        className="rounded-2xl overflow-hidden animate-[fadeInUp_0.5s_ease-out]"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div>
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">No events matched the current filters.</p>
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
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    background: isExpanded ? "rgba(0,0,0,0.01)" : "transparent",
                  }}
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tConfig.dot }} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-sm font-medium font-mono text-gray-900">
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
                      <p className="text-sm truncate text-gray-500">{event.details}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">{event.actor}</p>
                      <p className="text-xs text-gray-400">{formatTime(event.timestamp)}</p>
                    </div>

                    <svg
                      className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 text-gray-400 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 ml-6.5 pl-4 space-y-2 animate-[fadeInUp_0.2s_ease-out]" style={{ borderLeft: "2px solid rgba(212,168,67,0.2)" }}>
                      <DetailRow label="Timestamp" value={new Date(event.timestamp).toLocaleString()} />
                      <DetailRow label="Triggered By" value={event.actor} />
                      <DetailRow label="Client IP" value={event.ip} />
                      <DetailRow label="User Agent" value={event.userAgent} />
                      <DetailRow label="Log Message" value={event.details} />
                      <DetailRow label="Event Ref" value={event.id} />
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

function SummaryCard({ label, value, colorIndex }: { label: string; value: string; colorIndex: number }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400">{label}</p>
      <p className="text-2xl font-bold" style={{ color: summaryGradients[colorIndex].text }}>
        {value}
      </p>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
      style={{
        background: active ? "rgba(212,168,67,0.1)" : "rgba(0,0,0,0.03)",
        color: active ? "#b8922e" : "#6b6b6b",
        border: active ? "1px solid rgba(212,168,67,0.2)" : "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider w-24 flex-shrink-0 text-gray-400">
        {label}
      </span>
      <span className="text-xs font-mono text-gray-600">{value}</span>
    </div>
  );
}
