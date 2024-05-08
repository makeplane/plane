import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
// ui
import { useTheme } from "next-themes";
// components
import { AuthRoot } from "@/components/account";
import { PageHead } from "@/components/core";
// constants
import { NAVIGATE_TO_SIGNUP } from "@/constants/event-tracker";
// helpers
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useEventTracker } from "@/hooks/store";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// types
import { NextPageWithLayout } from "@/lib/types";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
// assets
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export type AuthType = "sign-in" | "sign-up";

const SignInPage: NextPageWithLayout = observer(() => {
  // store hooks
  const { captureEvent } = useEventTracker();
  // hooks
  const { resolvedTheme } = useTheme();

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <PageHead title="Sign In" />
      <div className="absolute inset-0 z-0">
        <Image
          src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
          className="w-full h-full object-cover"
          alt="Plane background pattern"
        />
      </div>
      <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
        <div className="container mx-auto px-10 lg:px-0 flex-shrink-0 relative flex items-center justify-between pb-4 transition-all">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
          <div className="text-center text-sm font-medium text-onboarding-text-300">
            New to Plane?{" "}
            <Link
              href="/"
              onClick={() => captureEvent(NAVIGATE_TO_SIGNUP, {})}
              className="font-semibold text-custom-primary-100 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
        <div className="flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 py-10 lg:pt-28 transition-all">
          <AuthRoot authMode={EAuthModes.SIGN_IN} />
        </div>
      </div>
    </div>
  );
});

SignInPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>{page}</AuthenticationWrapper>
    </DefaultLayout>
  );
};

export default SignInPage;
