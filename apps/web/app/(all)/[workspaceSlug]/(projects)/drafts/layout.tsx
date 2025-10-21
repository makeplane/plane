"use client";

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { WorkspaceDraftHeader } from "./header";

export default function WorkspaceDraftLayout() {
  return (
    <>
      <AppHeader header={<WorkspaceDraftHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
