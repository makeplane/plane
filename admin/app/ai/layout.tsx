"use client";

import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts/admin-layout";

export default function AILayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
