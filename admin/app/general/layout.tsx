import { ReactNode } from "react";
import { Metadata } from "next";
// components
import { AdminLayout } from "@/layouts/admin-layout";

export const metadata: Metadata = {
  title: "General Settings - God Mode",
};

export default function GeneralLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
