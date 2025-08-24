"use client";
import { ReactNode } from "react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
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
