import React, { useEffect } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
// ui
import { useTheme } from "next-themes";
import { Spinner } from "@plane/ui";
// components
import { AuthRoot, EAuthModes } from "@/components/account";
import { PageHead } from "@/components/core";
// constants
import { NAVIGATE_TO_SIGNIN } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useInstance, useUser } from "@/hooks/store";
import useAuthRedirection from "@/hooks/use-auth-redirection";
// types
// assets
import PlaneBackgroundPatternDark from "public/onboarding/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/onboarding/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export const SignUpView = observer(() => {
  // store hooks
  const { instance } = useInstance();
  const { data: currentUser } = useUser();
  const { captureEvent } = useEventTracker();
  // hooks
  const { resolvedTheme } = useTheme();
  // login redirection hook
  const { isRedirecting, handleRedirection } = useAuthRedirection();

  useEffect(() => {
    handleRedirection();
  }, [handleRedirection]);

  if (isRedirecting || currentUser || !instance?.config)
    return (
      <div className="grid h-screen place-items-center">
        <Spinner />
      </div>
    );

  return (
    <div className="relative">
      <PageHead title="Sign Up" />
      <div className="absolute inset-0 z-0">
      <Image
          src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
          className="w-screen min-h-screen object-cover"
          alt="Plane background pattern"
        />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
          <div className="text-center text-sm font-medium text-onboarding-text-300">
            Already have an account?{" "}
            <Link
              href="/accounts/sign-in"
              onClick={() => captureEvent(NAVIGATE_TO_SIGNIN, {})}
              className="font-semibold text-custom-primary-100 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
        <div className="mx-auto h-full">
          <div className="h-full overflow-auto px-7 pb-56 pt-4 sm:px-0">
            <AuthRoot mode={EAuthModes.SIGN_UP} />
          </div>
        </div>
      </div>
    </div>
  );
});
