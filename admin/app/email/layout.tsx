"use client";

import { ReactNode } from "react";
// layouts
import { AuthLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface EmailLayoutProps {
  children: ReactNode;
}

const EmailLayout = ({ children }: EmailLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AuthLayout>{children}</AuthLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default EmailLayout;
