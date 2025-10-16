"use client";

import type { ReactNode } from "react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
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
