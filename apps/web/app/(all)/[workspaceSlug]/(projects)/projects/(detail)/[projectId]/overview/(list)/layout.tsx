"use client";

import { ReactNode } from "react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { OverviewListHeader } from "./header";

export default function ProjectOverviewListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<OverviewListHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
