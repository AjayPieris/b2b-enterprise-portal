"use client";

import AuthGuard from "../components/AuthGuard";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
