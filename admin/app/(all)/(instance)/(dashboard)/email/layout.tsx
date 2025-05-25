import { ReactNode } from "react";
import { Metadata } from "next";
import { AdminLayout } from "@/layouts/admin-layout";

interface EmailLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Email Settings - Plane Web",
};

export default function EmailLayout({ children }: EmailLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
