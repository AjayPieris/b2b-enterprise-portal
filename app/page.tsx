"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { state, signIn } = useAuthContext();
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/dashboard");
    }
  }, [state.isAuthenticated, router]);

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

    
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-10 text-center relative z-10">

        
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Enterprise Portal</h1>
        <p className="text-purple-300/70 text-sm mb-8">
          Secure B2B dashboard powered by WSO2 Asgardeo
        </p>

      
        <button
          onClick={() => signIn()}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3.5 px-8 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          Sign in with Asgardeo
        </button>

        {/* Security note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-purple-400/40 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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