"use client";

import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface AILayoutProps {
  children: ReactNode;
}

const AILayout = ({ children }: AILayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AdminLayout>{children}</AdminLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default AILayout;
