"use client";

import { ReactNode } from "react";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";
// helpers
import { EAuthenticationPageType } from "@/helpers";

interface RootLayoutProps {
  children: ReactNode;
}

export const RootLayout = async ({ children }: RootLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper authType={EAuthenticationPageType.NOT_AUTHENTICATED}>{children}</AuthWrapper>
  </InstanceWrapper>
);

export default RootLayout;
