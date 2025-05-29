"use client";

import { AppHeader } from "@/components/core";
import { ContentWrapper } from "@plane/ui";
import { WorkspaceLabelHeader } from "./header";

export default function WorkspaceLabelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<WorkspaceLabelHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
