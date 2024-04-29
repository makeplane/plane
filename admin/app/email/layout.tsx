"use client";

import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface EmailLayoutProps {
  children: ReactNode;
}

const EmailLayout = ({ children }: EmailLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AdminLayout>{children}</AdminLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default EmailLayout;
