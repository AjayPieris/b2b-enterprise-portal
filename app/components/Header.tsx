"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";

export default function Header() {
  const { state, getBasicUserInfo } = useAuthContext();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (state.isAuthenticated) {
      getBasicUserInfo().then((info) => {
        setUserInfo(info);
        const roles = info?.groups || info?.roles || "";
        const adminCheck = Array.isArray(roles)
          ? roles.some((r: string) => r?.toLowerCase()?.includes("admin"))
          : typeof roles === "string" && roles.toLowerCase().includes("admin");
        setIsAdmin(adminCheck);
      });
    }
  }, [state.isAuthenticated]);

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
