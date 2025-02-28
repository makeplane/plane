import { ReactNode } from "react";
import { Metadata } from "next";
// layouts
import { AdminLayout } from "@/layouts/admin-layout";

export const metadata: Metadata = {
  title: "Workspace Management - ReyFlow Web",
};

export default function WorkspaceManagementLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
