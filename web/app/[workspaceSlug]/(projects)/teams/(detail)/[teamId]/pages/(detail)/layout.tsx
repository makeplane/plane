"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { TeamPageDetailHeader } from "./header";

export default function TeamPageDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<TeamPageDetailHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
