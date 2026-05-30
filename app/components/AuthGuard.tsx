"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { state, signIn, getBasicUserInfo } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated && !state.isLoading) {
      signIn();
      return;
    }

    if (state.isAuthenticated) {
      getBasicUserInfo().then((info) => {
        const roles = info?.groups || info?.roles || "";
        const adminCheck = Array.isArray(roles)
          ? roles.some((r: string) => r?.toLowerCase()?.includes("admin"))
          : typeof roles === "string" && roles.toLowerCase().includes("admin");
        setIsAdmin(adminCheck);
        setChecked(true);
        setIsLoading(false);
      });
    }
  }, [state.isAuthenticated, state.isLoading]);

  if (state.isLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-purple-300 text-sm animate-pulse">Authenticating with Asgardeo...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return null;
  }

  if (requireAdmin && checked && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white/5 backdrop-blur-md border border-red-500/30 rounded-2xl p-10 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-purple-300 text-sm">You need <span className="text-red-400 font-semibold">Admin</span> privileges to access this page.</p>
          <p className="text-purple-400/60 text-xs mt-3">Contact your organization administrator for access.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
