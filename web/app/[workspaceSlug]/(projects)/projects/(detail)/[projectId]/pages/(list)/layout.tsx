"use client";

import { ReactNode } from "react";
// components
import { ContentWrapper, AppHeader } from "@/components/core";
// local components
import { PagesListHeader } from "./header";

export default function ProjectPagesListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<PagesListHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
