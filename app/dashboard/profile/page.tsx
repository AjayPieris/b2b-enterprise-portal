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
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: "rgba(212,168,67,0.2)", borderTopColor: "#d4a843" }}
        />
      </div>
    );
  }

  const username = (userInfo?.username as string) || state.username || "Unknown";
  const email = (userInfo?.email as string) || (userInfo?.sub as string) || "—";
  const groups = userInfo?.groups || [];
  const sub = (userInfo?.sub as string) || "—";

  const initials = username.substring(0, 2).toUpperCase();

  const allRoles = Array.isArray(groups) ? groups : typeof groups === "string" ? [groups] : [];
  const isAdmin = allRoles.some((r: string) => r?.toLowerCase()?.includes("admin"));

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: "#9e9e9e" }}>
          Identity information retrieved securely from your login provider
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden animate-[fadeInUp_0.3s_ease-out]"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div className="h-32 relative" style={{ background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(240,217,140,0.25))" }}>
          <div className="absolute -bottom-10 left-8">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
              style={{
                background: "linear-gradient(135deg, #d4a843, #b8922e)",
                boxShadow: "0 4px 16px rgba(212, 168, 67, 0.3)",
                border: "4px solid #f5f0e8",
              }}
            >
              {initials}
            </div>
          </div>
        </div>

        <div className="pt-14 px-8 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>{username}</h2>
              <p className="text-sm" style={{ color: "#6b6b6b" }}>{email}</p>
            </div>
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
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeInUp_0.4s_ease-out]">
        <InfoCard label="User ID (sub)" value={sub} />
        <InfoCard label="Username" value={username} />
        <InfoCard label="Email Address" value={email} />
        <InfoCard label="Identity Provider" value="WSO2 Asgardeo" />
        <InfoCard label="Protocol" value="OpenID Connect" />
        <InfoCard label="Token Type" value="Bearer (JWT)" />
      </div>

      <div
        className="rounded-2xl p-6 animate-[fadeInUp_0.5s_ease-out]"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#1a1a1a" }}>Groups & Roles</h3>
        <p className="text-xs mb-4 text-gray-500">
          User roles mapping configured in the identity management system.
        </p>
        <div className="flex flex-wrap gap-2">
          {allRoles.length > 0 ? (
            allRoles.map((role: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg text-xs font-medium animate-[scaleIn_0.2s_ease-out]"
                style={{
                  background: role?.toLowerCase()?.includes("admin")
                    ? "rgba(212,168,67,0.1)"
                    : "rgba(0,0,0,0.04)",
                  color: role?.toLowerCase()?.includes("admin")
                    ? "#b8922e"
                    : "#6b6b6b",
                  border: `1px solid ${role?.toLowerCase()?.includes("admin") ? "rgba(212,168,67,0.2)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No groups assigned</span>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400">
        {label}
      </p>
      <p className="font-medium text-sm truncate text-gray-900">{value}</p>
    </div>
  );
}
