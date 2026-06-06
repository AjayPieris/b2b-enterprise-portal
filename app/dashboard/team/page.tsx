"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";
import { mockTeamMembers, type MockTeamMember } from "../../lib/mockData";

type MemberStatus = "Active" | "Suspended" | "Invited";

function TeamContent() {
  const { state, getBasicUserInfo, getAccessToken } = useAuthContext();
  const [members, setMembers] = useState<MockTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: "delete" | "suspend" | "activate" } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAndMergeTeam() {
      try {
        let scimUsers: MockTeamMember[] = [];
        
        // 1. Fetch real SCIM users if authenticated
        if (state.isAuthenticated) {
          try {
            const token = await getAccessToken();
            const response = await fetch("/api/team", {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (response.ok) {
              const result = await response.json();
              scimUsers = (result.data || []).map((u: any) => {
                const isRealAdmin = u.role === "Admin";
                return {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: isRealAdmin ? "Admin" : "Viewer",
                  status: u.status === "Inactive" ? "Suspended" : "Active",
                  joinedAt: u.joinedAt,
                  department: isRealAdmin ? "Administration" : "General",
                  lastActive: "Active recently",
                  mfaEnabled: true,
                  avatar: u.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                };
              });
            } else {
              console.warn("Could not fetch real SCIM users", response.status);
            }
          } catch (e) {
            console.error("Failed fetching SCIM data", e);
          }
        }

        // 2. Fetch basic info for the logged-in user to show the "You" badge
        let realUser: MockTeamMember | null = null;
        let userIsAdmin = false;
        
        if (state.isAuthenticated) {
          const info = await getBasicUserInfo();
          const roles = info?.groups || info?.roles || "";
          userIsAdmin = Array.isArray(roles)
            ? roles.some((r: string) => r?.toLowerCase()?.includes("admin"))
            : typeof roles === "string" && roles.toLowerCase().includes("admin");
            
          setIsAdmin(userIsAdmin);

          const displayName =
            info?.displayName ||
            [info?.givenName, info?.familyName].filter(Boolean).join(" ") ||
            info?.username ||
            state.username ||
            "Current User";
          const email = (info?.email as string) || info?.username || state.username || "user@org.io";
          
          realUser = {
            id: "usr_real_active",
            name: displayName,
            email,
            role: userIsAdmin ? "Admin" : "Viewer",
            status: "Active",
            joinedAt: new Date().toISOString().split("T")[0],
            department: userIsAdmin ? "Administration" : "General",
            lastActive: "Just now",
            mfaEnabled: true,
            avatar: displayName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
          };
        }

        // 3. Merge: Real User -> Real SCIM Users -> Mock Users
        // Filter out mock duplicates or real duplicates by email
        const existingEmails = new Set<string>();
        const merged: MockTeamMember[] = [];
        
        if (realUser) {
          merged.push(realUser);
          existingEmails.add(realUser.email.toLowerCase());
        }
        
        for (const su of scimUsers) {
          if (!existingEmails.has(su.email.toLowerCase())) {
            merged.push(su);
            existingEmails.add(su.email.toLowerCase());
          }
        }
        
        for (const mu of mockTeamMembers) {
          if (!existingEmails.has(mu.email.toLowerCase())) {
            merged.push(mu);
            existingEmails.add(mu.email.toLowerCase());
          }
        }

        setMembers(merged);
      } catch (e: any) {
        setErrorMsg("Failed to load team completely.");
      } finally {
        setLoading(false);
      }
    }

    fetchAndMergeTeam();
  }, [state.isAuthenticated, getBasicUserInfo, getAccessToken, state.username]);

  const handleDelete = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setConfirmAction(null);
  };

  const handleToggleStatus = (id: string, newStatus: MemberStatus) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    setConfirmAction(null);
  };

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

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalActive = members.filter((m) => m.status === "Active").length;
  const totalSuspended = members.filter((m) => m.status === "Suspended").length;
  const totalMfa = members.filter((m) => m.mfaEnabled).length;
  const mfaPercent = members.length > 0 ? Math.round((totalMfa / members.length) * 100) : 0;

  const roleColors: Record<string, { bg: string; color: string; border: string }> = {
    "Super Admin": { bg: "rgba(220,38,38,0.08)", color: "#dc2626", border: "rgba(220,38,38,0.15)" },
    Admin: { bg: "rgba(212,168,67,0.1)", color: "#b8922e", border: "rgba(212,168,67,0.2)" },
    Editor: { bg: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "rgba(59,130,246,0.15)" },
    Viewer: { bg: "rgba(0,0,0,0.04)", color: "#6b6b6b", border: "rgba(0,0,0,0.08)" },
  };

  const statusColors: Record<string, { dot: string; text: string; shadow: string }> = {
    Active: { dot: "#16a34a", text: "#16a34a", shadow: "0 0 6px rgba(22,163,106,0.4)" },
    Suspended: { dot: "#dc2626", text: "#dc2626", shadow: "0 0 6px rgba(220,38,38,0.4)" },
    Invited: { dot: "#d4a843", text: "#b8922e", shadow: "0 0 6px rgba(212,168,67,0.4)" },
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary, #1a1a1a)" }}>Team Members</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted, #9e9e9e)" }}>
            Manage user directory, roles, and access permissions
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: isAdmin ? "rgba(212,168,67,0.1)" : "rgba(0,0,0,0.04)",
            color: isAdmin ? "#b8922e" : "#6b6b6b",
            border: `1px solid ${isAdmin ? "rgba(212,168,67,0.2)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          {isAdmin ? "⚡ Admin Control" : "🔒 Read Only"}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: members.length.toString(), color: "#b8922e" },
          { label: "Active Users", value: totalActive.toString(), color: "#16a34a" },
          { label: "Suspended", value: totalSuspended.toString(), color: "#dc2626" },
          { label: "MFA Adoption", value: `${mfaPercent}%`, color: mfaPercent >= 80 ? "#16a34a" : "#d4a843" },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-xl p-5"
            style={{
              background: "var(--bg-card, #ffffff)",
              border: "1px solid var(--border-light, rgba(0,0,0,0.06))",
              boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted, #9e9e9e)" }}>{card.label}</p>
            <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-light, rgba(0,0,0,0.06))", boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9e9e9e" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-[#d4a843] focus:border-transparent outline-none transition-all"
              style={{ borderColor: "rgba(0,0,0,0.08)" }}
            />
          </div>
          <div className="flex gap-2">
            {[null, "Super Admin", "Admin", "Editor", "Viewer"].map((role) => (
              <button
                key={role || "all"}
                onClick={() => setRoleFilter(role)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: roleFilter === role ? "rgba(212,168,67,0.1)" : "rgba(0,0,0,0.03)",
                  color: roleFilter === role ? "#b8922e" : "#6b6b6b",
                  border: roleFilter === role ? "1px solid rgba(212,168,67,0.2)" : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {role || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card, #ffffff)",
          border: "1px solid var(--border-light, rgba(0,0,0,0.06))",
          boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))",
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
              <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted, #9e9e9e)" }}>User Identity</th>
              <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted, #9e9e9e)" }}>Role</th>
              <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted, #9e9e9e)" }}>Department</th>
              <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted, #9e9e9e)" }}>Status</th>
              <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted, #9e9e9e)" }}>MFA</th>
              <th className="text-left px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted, #9e9e9e)" }}>Last Active</th>
              {isAdmin && (
                <th className="text-center px-6 py-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted, #9e9e9e)" }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => {
              const role = roleColors[member.role] || roleColors.Viewer;
              const status = statusColors[member.status] || statusColors.Active;
              const isProtectedRole = member.role === "Admin" || member.role === "Super Admin";
              const isRealUser = member.id === "usr_real";

              return (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50/50 transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    background: isRealUser ? "rgba(212,168,67,0.03)" : undefined,
                  }}
                >
                  {/* User Identity */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          background: isRealUser
                            ? "linear-gradient(135deg, #16a34a, #15803d)"
                            : "linear-gradient(135deg, #d4a843, #b8922e)",
                          boxShadow: isRealUser
                            ? "0 2px 6px rgba(22,163,106,0.3)"
                            : "0 2px 6px rgba(212, 168, 67, 0.25)",
                        }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary, #1a1a1a)" }}>{member.name}</p>
                          {isRealUser && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                              style={{ background: "rgba(22,163,106,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,106,0.2)" }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px]" style={{ color: "var(--text-muted, #9e9e9e)" }}>{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                      style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}
                    >
                      {member.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 text-sm" style={{ color: "var(--text-secondary, #6b6b6b)" }}>{member.department}</td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: status.dot, boxShadow: status.shadow }}
                      />
                      <span className="text-xs font-medium" style={{ color: status.text }}>{member.status}</span>
                    </div>
                  </td>

                  {/* MFA */}
                  <td className="px-6 py-4">
                    {member.mfaEnabled ? (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#16a34a" }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Enabled
                      </span>
                    ) : (
                      <span className="text-xs font-medium" style={{ color: "#9e9e9e" }}>Disabled</span>
                    )}
                  </td>

                  {/* Last Active */}
                  <td className="px-6 py-4 text-xs" style={{ color: "var(--text-muted, #9e9e9e)" }}>{member.lastActive}</td>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {isProtectedRole ? (
                        <div className="flex items-center justify-center">
                          <span
                            className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                            style={{ background: "rgba(0,0,0,0.03)", color: "#9e9e9e", border: "1px solid rgba(0,0,0,0.06)" }}
                          >
                            🔒 Protected
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          {/* Suspend / Activate Toggle */}
                          {member.status === "Active" ? (
                            <button
                              onClick={() => setConfirmAction({ id: member.id, type: "suspend" })}
                              title="Suspend user"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                              style={{ background: "rgba(234,88,12,0.06)", color: "#ea580c", border: "1px solid rgba(234,88,12,0.15)" }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          ) : member.status === "Suspended" ? (
                            <button
                              onClick={() => setConfirmAction({ id: member.id, type: "activate" })}
                              title="Reactivate user"
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                              style={{ background: "rgba(34,197,94,0.06)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.15)" }}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </button>
                          ) : null}

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmAction({ id: member.id, type: "delete" })}
                            title="Delete user"
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                            style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted, #9e9e9e)" }}>No members match your search criteria.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (() => {
        const target = members.find((m) => m.id === confirmAction.id);
        if (!target) return null;

        const actionConfig = {
          delete: {
            title: "Delete User",
            message: `Are you sure you want to permanently delete ${target.name}? This action cannot be undone.`,
            confirmLabel: "Delete User",
            confirmStyle: { background: "linear-gradient(135deg, #dc2626, #b91c1c)", color: "#fff" } as React.CSSProperties,
          },
          suspend: {
            title: "Suspend User",
            message: `Suspend ${target.name}? They will immediately lose access to all portal resources.`,
            confirmLabel: "Suspend User",
            confirmStyle: { background: "linear-gradient(135deg, #ea580c, #c2410c)", color: "#fff" } as React.CSSProperties,
          },
          activate: {
            title: "Reactivate User",
            message: `Reactivate ${target.name}? They will regain full access based on their assigned role.`,
            confirmLabel: "Reactivate",
            confirmStyle: { background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff" } as React.CSSProperties,
          },
        };

        const config = actionConfig[confirmAction.type];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-[fadeInUp_0.3s_ease-out]"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{config.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{config.message}</p>
              </div>
              <div className="px-6 py-4 flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmAction.type === "delete") {
                      handleDelete(confirmAction.id);
                    } else if (confirmAction.type === "suspend") {
                      handleToggleStatus(confirmAction.id, "Suspended");
                    } else {
                      handleToggleStatus(confirmAction.id, "Active");
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
                  style={config.confirmStyle}
                >
                  {config.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function TeamPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <TeamContent />
    </AuthGuard>
  );
}
