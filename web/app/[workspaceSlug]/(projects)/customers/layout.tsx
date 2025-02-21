"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { useWorkspace } from "@/hooks/store";

export default function WorkspaceDraftLayout({ children }: { children: React.ReactNode }) {
  // store
  const { currentWorkspace } = useWorkspace();

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Customers` : undefined;
  return (
    <>
      <AppHeader header={<></>} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
