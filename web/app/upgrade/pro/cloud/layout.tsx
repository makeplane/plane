"use client";

import { ReactNode } from "react";
// components
import { PageHead } from "@/components/core";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";

type Props = {
  children: ReactNode;
};

export default function CloudUpgradeLayout(props: Props) {
  const { children } = props;

  return (
    <div className="h-full w-full overflow-hidden">
      <PageHead title="Cloud upgrade - Plane" />
      <AuthenticationWrapper>
        {children}
      </AuthenticationWrapper>
    </div>
  );
}
