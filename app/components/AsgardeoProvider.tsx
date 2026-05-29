"use client"; 

import { AuthProvider } from "@asgardeo/auth-react";
const config = {
    signInRedirectURL: "http://localhost:3000",
    signOutRedirectURL: "http://localhost:3000",
    clientID: "m86jbtKrG3fYAfrfRN1vrfGoR00a", 
    baseUrl: "https://api.asgardeo.io/t/ajaypieris", 
    scope: ["openid", "profile", "groups", "roles"] 
}

export default function AsgardeoProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider config={config}>
            {children}
        </AuthProvider>
    );
}