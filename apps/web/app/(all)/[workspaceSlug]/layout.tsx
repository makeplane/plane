"use client";

import { AppRailProvider } from "@/hooks/context/app-rail-context";
import { WorkspaceContentWrapper } from "@/plane-web/components/workspace";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppRailProvider>
      <WorkspaceContentWrapper>{children}</WorkspaceContentWrapper>
    </AppRailProvider>
  );
}
