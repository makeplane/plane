import React, { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// ui
import { Button } from "@plane/ui";
import { UserCog2 } from "lucide-react";
// images
import instanceSetupDone from "public/instance-setup-done.svg";
import PlaneBlackLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import PlaneWhiteLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
import { useMobxStore } from "lib/mobx/store-provider";

export const InstanceSetupDone = () => {
  // states
  const [isRedirecting, setIsRedirecting] = useState(false);
  // next-themes
  const { resolvedTheme } = useTheme();
  // mobx store
  const {
    instance: { fetchInstanceInfo },
  } = useMobxStore();

  const planeLogo = resolvedTheme === "dark" ? PlaneWhiteLogo : PlaneBlackLogo;

  const redirectToGodMode = async () => {
    setIsRedirecting(true);

    await fetchInstanceInfo().finally(() => setIsRedirecting(false));
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="bg-onboarding-gradient-100 h-full w-full pt-12 overflow-hidden">
        <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 overflow-hidden">
          <div className="flex flex-col items-center relative px-7 sm:px-0 bg-onboarding-gradient-200 h-full rounded-t-md overflow-y-auto pb-8">
            <div className="flex py-10 justify-center">
              <div className="h-[30px]">
                <Image src={planeLogo} className="h-full w-full" alt="Plane logo" />
              </div>
            </div>

            <div className="grid place-items-center my-8">
              <div className="w-[444px]">
                <Image src={instanceSetupDone} className="h-full w-full" alt="image" />
              </div>
            </div>

            <div className="flex flex-col gap-8 items-center w-full sm:px-4">
              <div className="bg-purple-500/20 border border-purple-500 py-2.5 px-3 rounded text-center space-y-3">
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
