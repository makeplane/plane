"use client";

import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface AuthenticationLayoutProps {
  children: ReactNode;
}

const AuthenticationLayout = ({ children }: AuthenticationLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AdminLayout>{children}</AdminLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default AuthenticationLayout;
