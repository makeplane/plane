import { ReactNode } from "react";
import { Metadata } from "next";
import { AdminLayout } from "@/layouts/admin-layout";

export const metadata: Metadata = {
  title: "AI Settings - God Mode",
};

export default function AILayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
