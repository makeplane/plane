"use client";

import { ReactNode } from "react";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { CustomerDetailHeader } from "@/plane-web/components/customers";

export default function CustomerDetailLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<CustomerDetailHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
