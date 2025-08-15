"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { TeamspaceViewWorkItemsHeader } from "./header";

export default function TeamspaceViewWorkItemsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<TeamspaceViewWorkItemsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
