// app/layout.tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "B2B Enterprise Portal",
  description: "Multi-tenant secure enterprise portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} warm-gradient-bg min-h-screen`}>
        <ClientProviders>
            {children}
        </ClientProviders>
      </body>
    </html>
  );
}