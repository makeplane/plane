import React, { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// hooks
import { useApplication } from "hooks/store";
// ui
import { Button } from "@plane/ui";
import { UserCog2 } from "lucide-react";
// images
import instanceSetupDone from "public/instance-setup-done.webp";
import PlaneBlackLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import PlaneWhiteLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";

export const InstanceSetupDone = () => {
  // states
  const [isRedirecting, setIsRedirecting] = useState(false);
  // next-themes
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    instance: { fetchInstanceInfo },
  } = useApplication();

  const planeLogo = resolvedTheme === "dark" ? PlaneWhiteLogo : PlaneBlackLogo;

  const redirectToGodMode = async () => {
    setIsRedirecting(true);

    await fetchInstanceInfo().finally(() => setIsRedirecting(false));
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full w-full overflow-hidden bg-onboarding-gradient-100 pt-12">
        <div className="mx-auto h-full overflow-hidden rounded-t-md border-x border-t border-custom-border-200 bg-onboarding-gradient-100 px-4 pt-4 shadow-sm sm:w-4/5 md:w-2/3">
          <div className="relative flex h-full flex-col items-center overflow-y-auto rounded-t-md bg-onboarding-gradient-200 px-7 pb-8 sm:px-0">
            <div className="flex justify-center py-10">
              <div className="h-[30px]">
                <Image src={planeLogo} className="h-full w-full" alt="Plane logo" />
              </div>
            </div>

            <div className="my-8 grid place-items-center">
              <div className="w-[444px]">
                <Image src={instanceSetupDone} className="h-full w-full" alt="image" />
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-8 sm:px-4">
              <div className="space-y-3 rounded border border-purple-500 bg-purple-500/20 px-3 py-2.5 text-center">
                <h6 className="text-base font-semibold">
                  Your instance is now ready for more security, more controls, and more intelligence.
                </h6>
                <p className="text-xs font-medium">
                  Use this wisely. Remember, with great power comes great responsibility.
                </p>
              </div>
              <Button size="lg" prependIcon={<UserCog2 />} onClick={redirectToGodMode} loading={isRedirecting}>
                Go to God Mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
