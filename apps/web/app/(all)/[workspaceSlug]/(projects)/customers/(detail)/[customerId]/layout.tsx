"use client";

import { ReactNode } from "react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { CustomerDetailHeader } from "@/plane-web/components/customers";

export default function CustomerDetailLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<CustomerDetailHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
