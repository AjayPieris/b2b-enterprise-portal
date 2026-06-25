"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SIGN_IN_KEY = "asgardeo_signin_started";

export default function LandingPage() {
  const { state, signIn } = useAuthContext();
  const router = useRouter();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Checks sessionStorage to see if we initiated a sign-in attempt that failed
  useEffect(() => {
    const attempted = sessionStorage.getItem(SIGN_IN_KEY);

    if (attempted && !state.isLoading && !state.isAuthenticated) {
      sessionStorage.removeItem(SIGN_IN_KEY);
      setLoginError("Sign-in failed. Please check your credentials and try again.");
      setIsSigningIn(false);

      dismissTimer.current = setTimeout(() => setLoginError(null), 8000);
    }

    if (state.isAuthenticated) {
      sessionStorage.removeItem(SIGN_IN_KEY);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [state.isLoading, state.isAuthenticated]);

  // Redirect authenticated users directly to the dashboard
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [state.isAuthenticated, router]);

  const handleSignIn = () => {
    sessionStorage.setItem(SIGN_IN_KEY, "true");
    setIsSigningIn(true);
    setLoginError(null);
    signIn();
  };

  if (state.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-4 rounded-full animate-spin"
            style={{ borderColor: "rgba(212,168,67,0.2)", borderTopColor: "#d4a843" }}
          />
          <p className="text-sm text-gray-500">Connecting securely...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative background gradients */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #d4a843 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #b8922e 0%, transparent 70%)" }}
      />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <img
            src="/city.png"
            alt="Enterprise Portal Logo"
            className="w-8 h-8 rounded-lg object-cover shadow-sm"
          />
          <span className="font-bold text-sm tracking-wide text-gray-900">Enterprise Portal</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-gray-600">All Systems Operational</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-12 z-10 py-12">
        
        {/* Left Side: Enterprise Details & Value Prop */}
        <div className="flex-1 max-w-xl text-left space-y-6">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
            style={{ background: "rgba(212,168,67,0.12)", color: "#b8922e" }}
          >
            IAM Platform
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Unified Identity & <br />
            Access Management
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Protect your organization with secure single sign-on, centralized provisioning, real-time threat intelligence alerts, and full compliance auditing.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex gap-3">
              <div className="text-emerald-600 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Zero Trust Security</h4>
                <p className="text-xs text-gray-500">MFA & adaptive sign-in flows.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-emerald-600 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.75" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">SCIM 2.0 Provisioning</h4>
                <p className="text-xs text-gray-500">Automated user lifecycle management.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-emerald-600 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Real-time Analytics</h4>
                <p className="text-xs text-gray-500">API latency and active session monitoring.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-emerald-600 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-900">Compliance Audit Trail</h4>
                <p className="text-xs text-gray-500">Comprehensive, filterable security events.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Secure Login Container */}
        <div className="w-full lg:w-auto flex flex-col items-center">
          {loginError && (
            <div
              role="alert"
              className="w-full max-w-md mb-4 flex items-start gap-3 rounded-2xl px-5 py-4 border animate-[fadeInDown_0.3s_ease-out]"
              style={{
                background: "rgba(220, 38, 38, 0.05)",
                borderColor: "rgba(220, 38, 38, 0.15)",
                color: "#dc2626",
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div className="flex-1 text-sm text-left">
                <p className="font-semibold">Authentication Alert</p>
                <p className="text-xs opacity-90 mt-0.5">{loginError}</p>
              </div>
              <button
                onClick={() => setLoginError(null)}
                className="opacity-60 hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div
            className="w-full max-w-md rounded-3xl p-10 text-center"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src="/security.png"
              alt="Security Access Icon"
              className="w-14 h-14 mx-auto mb-6 object-contain"
            />

            <h3 className="text-2xl font-bold mb-1 text-gray-900">Secure Access Gateway</h3>
            <p className="text-sm text-gray-500 mb-8">Sign in to access your dashboard metrics and tenant resources.</p>

            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full font-semibold py-3.5 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-white cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #d4a843, #b8922e)",
                boxShadow: "0 4px 16px rgba(212, 168, 67, 0.3)",
              }}
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                "Sign In Securely"
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              OAuth 2.0 & OpenID Connect 1.0 Compliant
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Trust Details */}
      <footer className="w-full border-t mt-auto py-8 z-10" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <div>
            &copy; {new Date().getFullYear()} B2B Enterprise Portal. Powered by WSO2 Asgardeo.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 cursor-help">Security Architecture</span>
            <span>&bull;</span>
            <span className="hover:text-gray-600 cursor-help">SCIM 2.0 Protocol</span>
            <span>&bull;</span>
            <span className="hover:text-gray-600 cursor-help">Audit Logs</span>
          </div>
        </div>
      </footer>
    </main>
  );
}