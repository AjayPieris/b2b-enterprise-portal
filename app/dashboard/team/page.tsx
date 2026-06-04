"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";
import AuthGuard from "../../components/AuthGuard";

interface TeamMember {
  id: string | number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

function TeamContent() {
  const { getAccessToken } = useAuthContext();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const token = await getAccessToken();

        const response = await fetch("/api/team", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setMembers(result.data);
        } else {
          const errData = await response.json().catch(() => null);
          setErrorMsg(errData?.error || `Error ${response.status}: Failed to fetch team data`);
        }
      } catch (error: any) {
        console.error("Failed to fetch team:", error);
        setErrorMsg(error.message || "An unexpected error occurred while loading team.");
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [getAccessToken]);

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
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Team Members</h1>
          <p className="text-sm mt-1" style={{ color: "#9e9e9e" }}>
            Provisioned tenant directory users and permissions mapping
          </p>
        </div>
        <span
          className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: "rgba(212,168,67,0.1)",
            color: "#b8922e",
            border: "1px solid rgba(212,168,67,0.2)",
          }}
        >
          🔒 Admin Control
        </span>
      </div>

      {errorMsg && (
        <div
          className="p-4 rounded-xl text-sm font-medium border"
          style={{
            background: "rgba(220,38,38,0.05)",
            borderColor: "rgba(220,38,38,0.15)",
            color: "#dc2626",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Team table wrapper */}
      <div
        className="rounded-2xl overflow-hidden border border-gray-100"
        style={{
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">User Identity</th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Assigned Role</th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">SCIM Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Registered On</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="hover:bg-gray-50/50 transition-colors"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        background: "linear-gradient(135deg, #d4a843, #b8922e)",
                        boxShadow: "0 2px 6px rgba(212, 168, 67, 0.25)",
                      }}
                    >
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: member.role === "Admin" ? "rgba(212,168,67,0.1)" : "rgba(0,0,0,0.04)",
                      color: member.role === "Admin" ? "#b8922e" : "#6b6b6b",
                      border: `1px solid ${member.role === "Admin" ? "rgba(212,168,67,0.2)" : "rgba(0,0,0,0.08)"}`,
                    }}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: member.status === "Active" ? "#16a34a" : "#d4a843",
                        boxShadow: member.status === "Active"
                          ? "0 0 6px rgba(22,163,106,0.4)"
                          : "0 0 6px rgba(212,168,67,0.4)",
                      }}
                    />
                    <span className="text-sm text-gray-700">{member.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {member.joinedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
