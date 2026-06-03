"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";

// ─── Inner component that reads search params ──────────────────────────────
// Must be wrapped in <Suspense> when using useSearchParams in App Router.
// We avoid useSearchParams here entirely — see explanation below.

const SIGN_IN_KEY = "asgardeo_signin_started";

export default function LandingPage() {
  const { state, signIn } = useAuthContext();
  const router = useRouter();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Detect a failed/cancelled sign-in ──────────────────────────────────
  // When the user clicks "Sign in", we set a flag in sessionStorage.
  // If we land back on this page while NOT authenticated and the flag is set,
  // Asgardeo must have rejected / cancelled the flow → show the error banner.
  useEffect(() => {
    const attempted = sessionStorage.getItem(SIGN_IN_KEY);

    if (attempted && !state.isLoading && !state.isAuthenticated) {
      sessionStorage.removeItem(SIGN_IN_KEY);
      setLoginError(
        "Login failed. Please check your username and password, then try again."
      );
      setIsSigningIn(false);

      // auto-dismiss after 8 s
      dismissTimer.current = setTimeout(() => setLoginError(null), 8000);
    }

    if (state.isAuthenticated) {
      sessionStorage.removeItem(SIGN_IN_KEY);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [state.isLoading, state.isAuthenticated]);

  // ── Redirect to dashboard on success ─────────────────────────────────────
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [state.isAuthenticated, router]);

  function handleSignIn() {
    sessionStorage.setItem(SIGN_IN_KEY, "true");
    setIsSigningIn(true);
    setLoginError(null);
    signIn();
  }

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (state.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-purple-300 text-sm animate-pulse">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* ── Login-failed toast ───────────────────────────────────────────── */}
      {loginError && (
        <div
          role="alert"
          className="w-full max-w-md mb-5 relative z-10 flex items-start gap-3 bg-red-500/10 border border-red-500/40 backdrop-blur-md rounded-2xl px-5 py-4 shadow-lg shadow-red-500/10"
          style={{ animation: "fadeInDown 0.35s ease-out" }}
        >
          {/* Warning icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
            <svg
              className="w-4 h-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-red-300">Login Failed</p>
            <p className="text-xs text-red-400/80 mt-0.5 leading-relaxed">
              {loginError}
            </p>
          </div>

          {/* Dismiss × */}
          <button
            onClick={() => {
              setLoginError(null);
              if (dismissTimer.current) clearTimeout(dismissTimer.current);
            }}
            aria-label="Dismiss login error"
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-red-400/60 hover:text-red-300 hover:bg-red-500/20 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Main login card ──────────────────────────────────────────────── */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-10 text-center relative z-10">
        {/* Logo */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Enterprise Portal</h1>
        <p className="text-purple-300/70 text-sm mb-8">
          Secure B2B dashboard powered by WSO2 Asgardeo
        </p>

        {/* Sign-in button */}
        <button
          id="sign-in-btn"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3.5 px-8 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {isSigningIn ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting to Asgardeo…
            </>
          ) : (
            "Sign in with Asgardeo"
          )}
        </button>

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-purple-400/40 text-xs">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Secured with OAuth 2.0 &amp; OpenID Connect
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-purple-400/30 text-xs relative z-10">
        Identity managed by WSO2 Asgardeo
      </p>
    </main>
  );
}