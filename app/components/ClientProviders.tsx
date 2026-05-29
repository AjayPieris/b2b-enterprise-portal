"use client";

import dynamic from "next/dynamic";

const AsgardeoProvider = dynamic(
  () => import("./AsgardeoProvider"),
  { ssr: false }
);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AsgardeoProvider>{children}</AsgardeoProvider>;
}
