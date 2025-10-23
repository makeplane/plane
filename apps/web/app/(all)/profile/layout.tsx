"use client";

import type { ReactNode } from "react";
// wrappers
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
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
      <ProjectsAppPowerKProvider />
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
