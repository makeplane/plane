"use client";
import { ReactNode } from "react";
import { AppHeader, ContentWrapper, PageHead } from "@/components/core";
import { useWorkspace } from "@/hooks/store";
// components
import { CustomersListHeader } from "@/plane-web/components/customers/list";

export default function CustomersListLayout({ children }: { children: ReactNode }) {
  // hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Customers` : undefined;
  return (
    <>
      <PageHead title={pageTitle} />
      <AppHeader header={<CustomersListHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
