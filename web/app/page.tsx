"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
// ui
import { useTheme } from "next-themes";
// components
import { NAVIGATE_TO_SIGNUP } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AuthRoot } from "@/components/account";
import { PageHead } from "@/components/core";
// constants
// helpers
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// assets
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";
import BlackHorizontalLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";

const HomePage = observer(() => {
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { captureEvent } = useEventTracker();

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
        <>
          <div className="relative w-screen h-screen overflow-hidden">
            <PageHead title={t("auth.common.login") + " - Plane"} />
            <div className="absolute inset-0 z-0">
              <Image
                src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
                className="w-full h-full object-cover"
                alt="Plane background pattern"
              />
            </div>
            <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
              <div className="container min-w-full px-10 lg:px-20 xl:px-36 flex-shrink-0 relative flex items-center justify-between pb-4 transition-all">
                <div className="flex items-center gap-x-2 py-10">
                  <Link href={`/`} className="h-[30px] w-[133px]">
                    <Image src={logo} alt="Plane logo" />
                  </Link>
                </div>
                <div className="flex flex-col items-end sm:items-center sm:gap-2 sm:flex-row text-center text-sm font-medium text-onboarding-text-300">
                  {t("auth.common.new_to_plane")}
                  <Link
                    href="/sign-up"
                    onClick={() => captureEvent(NAVIGATE_TO_SIGNUP, {})}
                    className="font-semibold text-custom-primary-100 hover:underline"
                  >
                    {t("auth.common.create_account")}
                  </Link>
                </div>
              </div>
              <div className="flex flex-col justify-center flex-grow container h-[100vh-60px] mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 transition-all">
                <AuthRoot authMode={EAuthModes.SIGN_IN} />
              </div>
            </div>
          </div>
        </>
      </AuthenticationWrapper>
    </DefaultLayout>
  );
});

export default HomePage;
