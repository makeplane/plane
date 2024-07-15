"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
// components
import { PageHead } from "@/components/core";
// helpers
import { SwitchAccountDropdown } from "@/components/onboarding";
import { EPageTypes } from "@/helpers/authentication.helper";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// assets
import PlaneProLogo from "@/public/plane-logos/plane-pro.svg";

type Props = {
  children: ReactNode;
};

export default function UpgradePlanLayout(props: Props) {
  const { children } = props;

  return (
    <div className="h-screen w-full overflow-hidden">
      <AuthenticationWrapper pageType={EPageTypes.PUBLIC}>
        <PageHead title="Upgrade - Plane" />
        <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
          <div className="container mx-auto px-10 lg:px-0 flex-shrink-0 relative flex items-center justify-between pb-4 transition-all">
            <div className="flex items-center gap-x-2 py-10">
              <Link href={`/upgrade/pro`} className="h-[30px] w-full">
                <Image src={PlaneProLogo} alt="Plane pro logo" />
              </Link>
            </div>
            <div className="flex flex-col items-end sm:items-center sm:gap-2 sm:flex-row text-center text-sm font-medium text-onboarding-text-300">
              <SwitchAccountDropdown />
            </div>
          </div>
          <div className="flex flex-col justify-center container h-[calc(100vh-240px)] mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 transition-all">
            {children}
          </div>
        </div>
      </AuthenticationWrapper>
    </div>
  );
}
