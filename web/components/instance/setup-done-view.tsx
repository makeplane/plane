import React from "react";
import Image from "next/image";

// ui
import { Button } from "@plane/ui";
import { UserCog2 } from "lucide-react";
// image
import instanceSetupDone from "public/instance-setup-done.svg";
import PlaneLogo from "public/plane-logos/blue-without-text.png";

export const InstanceSetupDone = () => (
  <div className="h-screen w-full overflow-hidden">
    <div className={`bg-onboarding-gradient-100 h-screen w-full pt-12`}>
      <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 ">
        <div
          className={`flex flex-col items-center relative px-7 sm:px-0 bg-onboarding-gradient-200 h-full rounded-t-md overflow-auto`}
        >
          <div className="flex items-center gap-5 py-10 justify-center">
            <Image src={PlaneLogo} height={44} width={44} alt="image" />
            <span className="text-4xl font-semibold">To the stratosphere now!</span>
          </div>

          <div className="flex items-center justify-center">
            <Image src={instanceSetupDone} height={360} width={444} alt="image" />
          </div>

          <div className="flex flex-col gap-8 items-center py-12 w-full">
            <span className="text-xl font-medium">
              Your instance is now ready for more security, more controls, and more intelligence.
            </span>
            <Button size="lg" prependIcon={<UserCog2 />}>
              Go to God Mode
            </Button>

            <div className="flex p-2.5 text-custom-primary-100 bg-custom-primary-10 border border-custom-primary-100 text-sm text-left mx-auto rounded">
              Use this wisely. Remember, with great power comes great responsibility.🕷️
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
