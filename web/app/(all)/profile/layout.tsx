"use client";

import dynamic from "next/dynamic";
import { AuthenticationWrapper } from "@/lib/wrappers";
import { ProfileLayoutSidebar } from "./sidebar";

// Dynamically import heavy components
const CommandPalette = dynamic(
  () => import("@/components/command-palette").then((module) => ({ default: module.CommandPalette })),
  {
    ssr: false, // Command palette doesn't need SSR
    loading: () => null,
  }
);

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CommandPalette />
      <AuthenticationWrapper>
        <div className="relative flex h-full w-full overflow-hidden">
          <ProfileLayoutSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            <div className="h-full w-full overflow-hidden">{children}</div>
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
