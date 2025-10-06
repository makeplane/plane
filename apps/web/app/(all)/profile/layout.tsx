"use client";

import { ReactNode } from "react";
// wrappers
import { CommandPaletteProvider } from "@/components/power-k/modal-wrapper";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";
// layout
import { ProfileLayoutSidebar } from "./sidebar";

type Props = {
  children: ReactNode;
};

export default function ProfileSettingsLayout(props: Props) {
  const { children } = props;

  return (
    <>
      <CommandPaletteProvider />
      <AuthenticationWrapper>
        <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-custom-border-200">
          <ProfileLayoutSidebar />
          <main className="relative flex h-full w-full flex-col overflow-hidden bg-custom-background-100">
            <div className="h-full w-full overflow-hidden">{children}</div>
          </main>
        </div>
      </AuthenticationWrapper>
    </>
  );
}
