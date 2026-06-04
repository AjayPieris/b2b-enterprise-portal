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
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin"
            style={{ borderColor: 'rgba(212,168,67,0.2)', borderTopColor: '#d4a843' }}
          />
          <p className="text-sm animate-pulse" style={{ color: '#b8922e' }}>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background warm glows */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ background: 'rgba(212, 168, 67, 0.08)' }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ background: 'rgba(212, 168, 67, 0.05)', animationDelay: '1s' }}
      />

      {/* ── Login-failed toast ───────────────────────────────────────────── */}
      {loginError && (
        <div
          role="alert"
          className="w-full max-w-md mb-5 relative z-10 flex items-start gap-3 rounded-2xl px-5 py-4"
          style={{
            background: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.15)',
            boxShadow: '0 4px 16px rgba(220, 38, 38, 0.08)',
            animation: 'fadeInDown 0.35s ease-out',
          }}
        >
          {/* Warning icon */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: 'rgba(220, 38, 38, 0.1)' }}
          >
            <svg className="w-4 h-4" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>Login Failed</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(220, 38, 38, 0.7)' }}>
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
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'rgba(220, 38, 38, 0.4)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Main login card ──────────────────────────────────────────────── */}
      <div
        className="w-full max-w-md rounded-3xl p-10 text-center relative z-10"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.08)',
        }}
      >
        {/* Logo */}
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #d4a843, #b8922e)',
            boxShadow: '0 8px 24px rgba(212, 168, 67, 0.3)',
          }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Enterprise Portal</h1>
        <p className="text-sm mb-8" style={{ color: '#9e9e9e' }}>
          Secure B2B dashboard powered by WSO2 Asgardeo
        </p>

        {/* Sign-in button */}
        <button
          id="sign-in-btn"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full font-semibold py-3.5 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-white disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #d4a843, #b8922e)',
            boxShadow: '0 4px 16px rgba(212, 168, 67, 0.3)',
          }}
          onMouseEnter={e => {
            if (!isSigningIn) {
              (e.target as HTMLElement).style.boxShadow = '0 8px 24px rgba(212, 168, 67, 0.4)';
              (e.target as HTMLElement).style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.boxShadow = '0 4px 16px rgba(212, 168, 67, 0.3)';
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }}
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
        <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: '#9e9e9e' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secured with OAuth 2.0 &amp; OpenID Connect
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs relative z-10" style={{ color: '#b8b8b8' }}>
        Identity managed by WSO2 Asgardeo
      </p>
    </main>
  );
}