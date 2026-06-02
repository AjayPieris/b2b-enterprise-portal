"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { state, getBasicUserInfo } = useAuthContext();
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const info = await getBasicUserInfo();
        console.log("Asgardeo user profile:", info);
        setUserInfo(info as Record<string, unknown>);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }

    if (state.isAuthenticated) {
      loadProfile();
    }
  }, [state.isAuthenticated, getBasicUserInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Extract user data from the Asgardeo ID token claims
  const username = (userInfo?.username as string) || state.username || "Unknown";
  const email = (userInfo?.email as string) || (userInfo?.sub as string) || "—";
  const groups = userInfo?.groups || [];
  const sub = (userInfo?.sub as string) || "—";

  // Build initials from username
  const initials = username.substring(0, 2).toUpperCase();

  // Check admin status
  const allRoles = Array.isArray(groups) ? groups : typeof groups === "string" ? [groups] : [];
  const isAdmin = allRoles.some((r: string) => r?.toLowerCase()?.includes("admin"));

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-purple-300/50 text-sm mt-1">
          Identity information managed by WSO2 Asgardeo
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-purple-600/40 to-indigo-600/40 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-indigo-950">
              {initials}
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="pt-14 px-8 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{username}</h2>
              <p className="text-purple-300/60 text-sm">{email}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                isAdmin
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-purple-500/15 text-purple-400 border-purple-500/30"
              }`}
            >
              {isAdmin ? "⚡ Admin" : "👤 Member"}
            </span>
          </div>
        </div>
      </div>

      {/* Identity details — data comes directly from Asgardeo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard label="User ID (sub)" value={sub} />
        <InfoCard label="Username" value={username} />
        <InfoCard label="Email" value={email} />
        <InfoCard label="Identity Provider" value="WSO2 Asgardeo" />
        <InfoCard label="Auth Protocol" value="OpenID Connect" />
        <InfoCard label="Token Type" value="Bearer (JWT)" />
      </div>

      {/* Groups & Roles from Asgardeo */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Groups & Roles</h3>
        <p className="text-purple-300/50 text-xs mb-4">
          These are assigned in WSO2 Asgardeo console and returned via the ID token &quot;groups&quot; claim
        </p>
        <div className="flex flex-wrap gap-2">
          {allRoles.length > 0 ? (
            allRoles.map((role: string, i: number) => (
              <span
                key={i}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  role?.toLowerCase()?.includes("admin")
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                    : "bg-purple-500/15 text-purple-300 border-purple-500/20"
                }`}
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-purple-400/40 text-sm">No groups assigned</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Small reusable component for displaying a labeled value
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
      <p className="text-purple-300/50 text-xs font-semibold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-white font-medium text-sm truncate">{value}</p>
    </div>
  );
}
