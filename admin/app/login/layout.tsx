"use client";

import { ReactNode } from "react";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";
// helpers
import { EAuthenticationPageType, EInstancePageType } from "@/helpers";

interface LoginLayoutProps {
  children: ReactNode;
}

const LoginLayout = ({ children }: LoginLayoutProps) => (
  <InstanceWrapper pageType={EInstancePageType.POST_SETUP}>
    <AuthWrapper authType={EAuthenticationPageType.NOT_AUTHENTICATED}>{children}</AuthWrapper>
  </InstanceWrapper>
);

export default LoginLayout;
