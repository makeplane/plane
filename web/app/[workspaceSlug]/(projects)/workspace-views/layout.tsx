"use client";

import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { GlobalIssuesHeader } from "./header";

export default function GlobalIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<GlobalIssuesHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
