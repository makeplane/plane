"use client";

// components
import { AppHeader } from "@/components/core/app-header";
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
