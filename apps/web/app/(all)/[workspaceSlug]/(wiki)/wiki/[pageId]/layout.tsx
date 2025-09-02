"use client";

// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// layout
import { PageDetailsHeader } from "./header";

export default function PageDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<PageDetailsHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
