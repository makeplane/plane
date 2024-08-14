"use client";

import { ReactNode } from "react";
// components
import { PageHead } from "@/components/core";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";

type Props = {
  children: ReactNode;
};

export default function SelfHostedUpgradeLayout(props: Props) {
  const { children } = props;

  return (
    <div className="h-full w-full overflow-hidden">
      <PageHead title="Self-hosted upgrade - Plane" />
      <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>{children}</AuthenticationWrapper>
    </div>
  );
}
