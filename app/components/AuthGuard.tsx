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
  }, [state.isAuthenticated, state.isLoading, signIn, getBasicUserInfo]);

  if (state.isLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin"
            style={{ borderColor: 'rgba(212,168,67,0.2)', borderTopColor: '#d4a843' }}
          />
          <p className="text-sm animate-pulse" style={{ color: '#b8922e' }}>Authenticating with Asgardeo...</p>
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
        <div
          className="rounded-2xl p-10 text-center max-w-md"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(220,38,38,0.15)',
            boxShadow: '0 4px 16px rgba(220,38,38,0.06)',
          }}
        >
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(220,38,38,0.06)' }}
          >
            <svg className="w-8 h-8" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Access Denied</h2>
          <p className="text-sm" style={{ color: '#6b6b6b' }}>
            You need <span className="font-semibold" style={{ color: '#dc2626' }}>Admin</span> privileges to access this page.
          </p>
          <p className="text-xs mt-3" style={{ color: '#9e9e9e' }}>Contact your organization administrator for access.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
