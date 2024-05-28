import { ReactNode } from "react";
import { Metadata } from "next";
import { AdminLayout } from "@/layouts/admin-layout";

interface EmailLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Email Settings - God Mode",
};

const EmailLayout = ({ children }: EmailLayoutProps) => <AdminLayout>{children}</AdminLayout>;

export default EmailLayout;
