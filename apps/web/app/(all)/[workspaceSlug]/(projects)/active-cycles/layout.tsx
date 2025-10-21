"use client";

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceActiveCycleHeader } from "./header";

export default function WorkspaceActiveCycleLayout() {
  return (
    <>
      <AppHeader header={<WorkspaceActiveCycleHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
