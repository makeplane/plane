import { FC } from "react";
import Image from "next/image";
import { Button } from "@plane/ui";
// images
import PlaneTakeOffImage from "@/public/plane-takeoff.png";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

export const InstanceNotReady: FC = () => {

  const planeGodModeUrl = `${process.env.NEXT_PUBLIC_GOD_MODE_URL}/god-mode/setup/?auth_enabled=0`;

  return (
    <div className="relative h-screen max-h-max w-full overflow-hidden overflow-y-auto flex flex-col">
      <div className="flex-shrink-0 h-[100px]">
        <div className="relative h-full container mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
        <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
        </div>
      </div>
      <div className="w-full flex-grow px-5 lg:px-0 mb-[100px]">
        <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center">
          <div className="w-auto max-w-2xl relative space-y-8 py-10">
            <div className="relative flex flex-col justify-center items-center space-y-4">
              <h1 className="text-3xl font-bold pb-3">Welcome aboard Plane!</h1>
              <Image src={PlaneTakeOffImage} alt="Plane Logo" />
              <p className="font-medium text-base text-onboarding-text-400">
                Get started by setting up your instance and workspace
              </p>
            </div>
            <div>
              <a href={planeGodModeUrl}>
                <Button size="lg" className="w-full">
                  Get started
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
