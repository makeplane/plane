"use client";

// components
import { AppHeader } from "@/components/core";
import { PageTypeHeader } from "../header";

export default function ArchivedPagesListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<PageTypeHeader pageType="archived" />} />
      {children}
    </>
  );
}
