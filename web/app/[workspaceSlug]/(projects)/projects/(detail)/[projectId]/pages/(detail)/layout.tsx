"use client";

// component
import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { PageDetailsHeader } from "./header";

export default function ProjectPageDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<PageDetailsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
