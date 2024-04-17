"use client";

import { ReactNode } from "react";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";
// helpers
import { EAuthenticationPageType } from "@/helpers";

interface SetupLayoutProps {
  children: ReactNode;
}

const SetupLayout = ({ children }: SetupLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper authType={EAuthenticationPageType.NOT_AUTHENTICATED}>{children}</AuthWrapper>
  </InstanceWrapper>
);

export default SetupLayout;
