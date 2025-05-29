"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
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
