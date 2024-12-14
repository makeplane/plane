"use client";

// components
import { AppHeader } from "@/components/core";
// local components
import { PageTypeFiltersHeader } from "../filters-header";
import { PageTypeHeader } from "../header";

export default function ArchivedPagesListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<PageTypeHeader pageType="archived" />} />
      <PageTypeFiltersHeader />
      {children}
    </>
  );
}
