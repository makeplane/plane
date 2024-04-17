"use client";

import { ReactNode } from "react";
// layouts
import { AuthLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface RootLayoutProps {
  children: ReactNode;
}

export const RootLayout = async ({ children }: RootLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AuthLayout>{children}</AuthLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default RootLayout;
