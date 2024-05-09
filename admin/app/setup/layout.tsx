"use client";

import { ReactNode } from "react";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";
// helpers
import { EAuthenticationPageType, EInstancePageType } from "@/helpers";

interface SetupLayoutProps {
  children: ReactNode;
}

const SetupLayout = ({ children }: SetupLayoutProps) => (
  <InstanceWrapper pageType={EInstancePageType.PRE_SETUP}>
    <AuthWrapper authType={EAuthenticationPageType.NOT_AUTHENTICATED}>{children}</AuthWrapper>
  </InstanceWrapper>
);

export default SetupLayout;
