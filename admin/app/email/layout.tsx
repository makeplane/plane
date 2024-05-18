"use client";

import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts/admin-layout";

interface EmailLayoutProps {
  children: ReactNode;
}

const EmailLayout = ({ children }: EmailLayoutProps) => <AdminLayout>{children}</AdminLayout>;

export default EmailLayout;
