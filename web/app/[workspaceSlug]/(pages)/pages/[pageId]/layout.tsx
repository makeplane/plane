"use client";

// components
import { AppHeader } from "@/components/core";
// layout
import { PageDetailsHeader } from "./header";

export default function PageDetailsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader header={<PageDetailsHeader />} />
      {children}
    </>
  );
}
