"use client";

import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
// ui
import { useTheme } from "next-themes";
// components
import { AUTH_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AuthRoot } from "@/components/account";
// constants
// helpers
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
// assets
import { AuthenticationWrapper } from "@/lib/wrappers";
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";
import BlackHorizontalLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";

export type AuthType = "sign-in" | "sign-up";

const SignInPage = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { resolvedTheme } = useTheme();

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
      <div className="relative w-screen h-screen overflow-hidden">
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
            <div className="flex flex-col items-end sm:items-center sm:gap-2 sm:flex-row  text-center text-sm font-medium text-onboarding-text-300">
              {t("auth.common.already_have_an_account")}
              <Link
                href="/"
                data-ph-element={AUTH_TRACKER_ELEMENTS.SIGN_IN_FROM_SIGNUP}
                className="font-semibold text-custom-primary-100 hover:underline"
              >
                {t("auth.common.login")}
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-center flex-grow container h-[100vh-60px] mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 transition-all">
            <AuthRoot authMode={EAuthModes.SIGN_UP} />
          </div>
        </div>
      </div>
    </AuthenticationWrapper>
  );
});

export default SignInPage;
