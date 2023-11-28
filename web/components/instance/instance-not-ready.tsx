import React from "react";
import Image from "next/image";

// image
import instanceNotReady from "public/instance-not-ready.svg";
import PlaneLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";

export const InstanceNotReady = () => {
  console.log("test");
  return (
    <div className="h-screen w-full overflow-hidden">
      <div className={`bg-onboarding-gradient-100 h-screen w-full pt-12`}>
        <div className="h-full bg-onboarding-gradient-100 md:w-2/3 sm:w-4/5 px-4 pt-4 rounded-t-md mx-auto shadow-sm border-x border-t border-custom-border-200 ">
          <div className={`relative px-7 sm:px-0 bg-onboarding-gradient-200 h-full  rounded-t-md overflow-auto`}>
            <div className="flex items-center py-10 justify-center">
              <Image src={PlaneLogo} className="h-44 w-full" alt="image" />
            </div>

            <Image src={instanceNotReady} className="h-44 w-full" alt="image" />

            <div className="flex flex-col gap-5 items-center py-12 w-full">
              <h3 className="text-2xl font-medium">Your Plane instance isn’t ready yet</h3>
              <p className="text-sm">Ask your Instance Admin to complete set-up first.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
