"use client";

import { ReactNode } from "react";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { InitiativesListHeader } from "./header";

export default function InitiativesListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<InitiativesListHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
