"use client";

import { Outlet } from "react-router";
import type { Route } from "../+types/layout";
import { AppRailProvider } from "@/hooks/context/app-rail-context";
import { WorkspaceContentWrapper } from "@/plane-web/components/workspace/content-wrapper";

export default function WorkspaceLayout() {
  return (
    <AppRailProvider>
      <WorkspaceContentWrapper>
        <Outlet />
      </WorkspaceContentWrapper>
    </AppRailProvider>
  );
}
