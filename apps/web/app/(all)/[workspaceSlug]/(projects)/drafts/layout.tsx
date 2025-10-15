"use client";

// components
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local imports
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
