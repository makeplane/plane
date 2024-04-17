"use client";

import { ReactNode } from "react";
// layouts
import { AuthLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface AuthenticationLayoutProps {
  children: ReactNode;
}

const AuthenticationLayout = ({ children }: AuthenticationLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AuthLayout>{children}</AuthLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default AuthenticationLayout;
