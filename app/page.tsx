"use client";

import { useAuthContext } from "@asgardeo/auth-react";
import { useEffect, useState } from "react";

export default function Home() {
  
  const { state, signIn, signOut, getBasicUserInfo } = useAuthContext();
  
  
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (state.isAuthenticated) {
      getBasicUserInfo().then((data) => {
        console.log("🔍 User Info from Asgardeo:", data);
        console.log("🔍 Groups:", data?.groups);
        setUserInfo(data);
      });
    }
  }, [state.isAuthenticated, getBasicUserInfo]);

  // Check if the user has the 'Admin' role
  const isAdmin = userInfo?.groups?.includes("Admin");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      
      {/* GLASSMORPHISM CARD */}
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-10 text-center">
        
        {!state.isAuthenticated ? (
          <>
            <h1 className="text-4xl font-bold text-white mb-4">Enterprise Portal</h1>
            <p className="text-purple-200 mb-8">Securely access your organization's dashboard.</p>
            <button
              onClick={() => signIn()}
              className="bg-white text-purple-900 font-semibold py-3 px-8 rounded-full hover:bg-purple-100 transition-colors shadow-lg"
            >
              Secure Login
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome back, {state.username}
            </h1>
            
            <div className="bg-black/20 rounded-xl p-6 mb-8 text-left text-white shadow-inner flex flex-col gap-4">
              <div>
                <p className="text-purple-300 text-sm font-semibold uppercase tracking-wider">Your Role</p>
                <p className="text-xl font-bold">{isAdmin ? "Organization Admin" : "Standard Employee"}</p>
              </div>

              {/* DYNAMIC UI: Only show this section if the user is an Admin */}
              {isAdmin && (
                <div className="mt-4 border-t border-white/20 pt-4">
                  <p className="text-purple-300 text-sm font-semibold uppercase tracking-wider mb-2">Admin Controls</p>
                  <div className="flex gap-4">
                    <button className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                      Manage Users
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg text-sm transition-colors">
                      Billing Settings
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => signOut()}
              className="border border-white/40 text-white font-semibold py-2 px-6 rounded-full hover:bg-white/10 transition-colors"
            >
              Sign Out
            </button>
          </>
        )}

      </div>
    </main>
  );
}