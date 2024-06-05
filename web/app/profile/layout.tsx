"use client";

import { ReactNode } from "react";
// components
import { CommandPalette } from "@/components/command-palette";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// layout
import { ProfileLayoutSidebar } from "./sidebar";

type Props = {
  children: ReactNode;
};

export default function ProfileSettingsLayout(props: Props) {
  const { children } = props;

  return (
    <>
      <CommandPalette />
      <AuthenticationWrapper>
        <div className="relative flex h-screen w-full overflow-hidden">
          <ProfileLayoutSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            <div className="h-full w-full overflow-hidden">{children}</div>
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
