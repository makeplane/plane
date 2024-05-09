import React from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
// ui
import { Avatar } from "@plane/ui";
// components
import { OnBoardingForm } from "@/components/accounts/onboarding-form";
// helpers
import { EPageTypes } from "@/helpers/authentication.helper";
// hooks
import { useUser, useUserProfile } from "@/hooks/store";
// wrappers
import { AuthWrapper } from "@/lib/wrappers";
// assets
import ProfileSetupDark from "public/onboarding/profile-setup-dark.svg";
import ProfileSetup from "public/onboarding/profile-setup.svg";

const imagePrefix = process.env.NEXT_PUBLIC_SPACE_BASE_PATH || "";

const OnBoardingPage = observer(() => {
  // router
  const router = useRouter();
  const { next_path } = router.query;

  // hooks
  const { resolvedTheme } = useTheme();

  const { data: user } = useUser();
  const { data: currentUserProfile, updateUserProfile } = useUserProfile();

  if (!user) {
    router.push("/");
    return <></>;
  }

  // complete onboarding
  const finishOnboarding = async () => {
    if (!user) return;

    await updateUserProfile({
      onboarding_step: {
        ...currentUserProfile?.onboarding_step,
        profile_complete: true,
      },
    }).catch(() => {
      console.log("Failed to update onboarding status");
    });

    if (next_path) router.replace(next_path.toString());
    router.replace("/");
  };

  return (
    <AuthWrapper pageType={EPageTypes.ONBOARDING}>
      <div className="flex h-full w-full">
        <div className="w-full h-full overflow-auto px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
          <div className="flex items-center justify-between">
            <div className="flex w-full items-center justify-between font-semibold ">
              <div className="flex items-center gap-x-2">
                <Image
                  src={`${imagePrefix}/plane-logos/blue-without-text.png`}
                  height={30}
                  width={30}
                  alt="Plane Logo"
                />
              </div>
            </div>
            <div className="shrink-0 lg:hidden">
              <div className="flex w-full shrink-0 justify-end">
                <div className="flex items-center gap-x-2 pr-4">
                  {user?.avatar && (
                    <Avatar
                      name={user?.first_name ? `${user?.first_name} ${user?.last_name ?? ""}` : user?.email}
                      src={user?.avatar}
                      size={24}
                      shape="square"
                      fallbackBackgroundColor="#FCBE1D"
                      className="!text-base capitalize"
                    />
                  )}
                  <span className="text-sm font-medium text-custom-text-200">
                    {user?.first_name ? `${user?.first_name} ${user?.last_name ?? ""}` : user?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full items-center justify-center p-8 mt-14">
            <div className="text-center space-y-1 py-4 mx-auto">
              <h3 className="text-3xl font-bold text-onboarding-text-100">Welcome to Plane!</h3>
              <p className="font-medium text-onboarding-text-400">
                Let’s setup your profile, tell us a bit about yourself.
              </p>
            </div>
            <OnBoardingForm user={user} finishOnboarding={finishOnboarding} />
          </div>
        </div>
        <div className="hidden lg:block relative w-2/5 h-screen overflow-hidden px-6 py-10 sm:px-7 sm:py-14 md:px-14 lg:px-28">
          <div className="flex w-full shrink-0 justify-end">
            <div className="flex items-center gap-x-2 pr-4 z-10">
              {user?.avatar && (
                <Avatar
                  name={user?.first_name ? `${user?.first_name} ${user?.last_name ?? ""}` : user?.email}
                  src={user?.avatar}
                  size={24}
                  shape="square"
                  fallbackBackgroundColor="#FCBE1D"
                  className="!text-base capitalize"
                />
              )}
              <span className="text-sm font-medium text-custom-text-200">
                {user?.first_name ? `${user?.first_name} ${user?.last_name ?? ""}` : user?.email}
              </span>
            </div>
          </div>
          <div className="absolute inset-0 z-0">
            <Image
              src={resolvedTheme === "dark" ? ProfileSetupDark : ProfileSetup}
              className="h-screen w-auto float-end object-cover"
              alt="Profile setup"
            />
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
});

export default OnBoardingPage;
