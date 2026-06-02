"use client"; 

import { AuthProvider } from "@asgardeo/auth-react";
const config = {
    signInRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL as string,
    signOutRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL as string,
    clientID: process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID as string, 
    baseUrl: process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL as string,
    scope: ["openid", "profile", "groups", "roles"]
}

export default function AsgardeoProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider config={config}>
            {children}
        </AuthProvider>
    );
}