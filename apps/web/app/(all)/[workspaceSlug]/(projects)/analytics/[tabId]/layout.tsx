"use client";

import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceAnalyticsHeader } from "./header";

export default function WorkspaceAnalyticsTabLayout() {
  return (
    <>
      <AppHeader header={<WorkspaceAnalyticsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
