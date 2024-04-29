"use client";

import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface GeneralLayoutProps {
  children: ReactNode;
}

const GeneralLayout = ({ children }: GeneralLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AdminLayout>{children}</AdminLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default GeneralLayout;
