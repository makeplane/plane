"use client";

import { AppLayout } from "@/layouts/app-layout";

export default function WorkspaceLayout({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return <AppLayout header={header}>{children}</AppLayout>;
}
