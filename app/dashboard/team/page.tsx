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
          setErrorMsg(errData?.error || `HTTP ${response.status}: Failed to fetch team data`);
        }
      } catch (error: any) {
        console.error("Failed to fetch team:", error);
        setErrorMsg(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchTeam();
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-purple-300/50 text-sm mt-1">
            Manage your organization members — Admin access only
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          🔒 Admin Only
        </span>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Team table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-purple-300/60 text-xs font-semibold uppercase tracking-wider">Member</th>
              <th className="text-left px-6 py-4 text-purple-300/60 text-xs font-semibold uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-4 text-purple-300/60 text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-purple-300/60 text-xs font-semibold uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{member.name}</p>
                      <p className="text-purple-300/50 text-xs">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    member.role === "Admin"
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                      : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      member.status === "Active" ? "bg-emerald-400" : "bg-yellow-400"
                    }`} />
                    <span className="text-sm text-purple-200/70">{member.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-purple-300/50">
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

// Wrap the entire page with AuthGuard requiring admin
export default function TeamPage() {
  return (
    <AuthGuard requireAdmin={true}>
      <TeamContent />
    </AuthGuard>
  );
}
