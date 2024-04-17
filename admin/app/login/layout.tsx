"use client";

import { ReactNode } from "react";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";
// helpers
import { EAuthenticationPageType } from "@/helpers";

interface LoginLayoutProps {
  children: ReactNode;
}

const LoginLayout = ({ children }: LoginLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper authType={EAuthenticationPageType.NOT_AUTHENTICATED}>{children}</AuthWrapper>
  </InstanceWrapper>
);

export default LoginLayout;
