"use client";

import { ReactNode } from "react";
// layouts
import { AuthLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface AILayoutProps {
  children: ReactNode;
}

const AILayout = ({ children }: AILayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AuthLayout>{children}</AuthLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default AILayout;
