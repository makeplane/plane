import { useEffect } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
// ui
import { Spinner } from "@plane/ui";
// components
import { SignInRoot } from "@/components/account";
import { PageHead } from "@/components/core";
// constants
import { NAVIGATE_TO_SIGNUP } from "@/constants/event-tracker";
// hooks
import { useEventTracker, useInstance, useUser } from "@/hooks/store";
import useSignInRedirection from "@/hooks/use-sign-in-redirection";
// assets
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export type AuthType = "sign-in" | "sign-up";

export const SignInView = observer(() => {
  // store hooks
  const { instance } = useInstance();
  const { data: currentUser } = useUser();
  const { captureEvent } = useEventTracker();
  // sign in redirection hook
  const { isRedirecting, handleRedirection } = useSignInRedirection();

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
    <>
      <PageHead title="Sign In" />
      <div className="h-full w-full overflow-hidden">
        <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
          <div className="text-center text-sm font-medium text-onboarding-text-300">
            New to Plane?{" "}
            <Link
              href="/accounts/sign-up"
              onClick={() => captureEvent(NAVIGATE_TO_SIGNUP, {})}
              className="font-semibold text-custom-primary-100 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
        <div className="mx-auto h-full">
          <div className="h-full overflow-auto px-7 pb-56 pt-4 sm:px-0">
            <SignInRoot />
          </div>
        </div>
      </div>
    </>
  );
});
