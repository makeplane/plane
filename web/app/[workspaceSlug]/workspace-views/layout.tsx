"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { GlobalIssuesHeader } from "./header";

export default function GlobalIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<GlobalIssuesHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
