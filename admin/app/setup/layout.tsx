"use client";

import { ReactNode } from "react";
// helpers
import { EAuthenticationPageType, EInstancePageType } from "@/helpers";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface SetupLayoutProps {
  children: ReactNode;
  params: any;
}

export default function SetupLayout(props: SetupLayoutProps) {
  const { children, params } = props;
  const { error_code } = params;
  console.log("error_code", error_code);
  return (
    <InstanceWrapper pageType={EInstancePageType.PRE_SETUP}>
      <AuthWrapper authType={EAuthenticationPageType.NOT_AUTHENTICATED}>{children}</AuthWrapper>
    </InstanceWrapper>
  );
}
