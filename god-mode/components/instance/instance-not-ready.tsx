import { FC } from "react";
import Image from "next/image";
// assets
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
import PlaneTakeOffImage from "public/images/plane-takeoff.png";
// ui
import { Button } from "@plane/ui";

export const InstanceNotReady: FC = () => (
    <div className="h-full w-full overflow-hidden">
      <div className="flex items-center justify-between px-8 pb-4 sm:px-16 sm:py-5 lg:px-28">
        <div className="flex items-center gap-x-2 pt-10 pb-4">
          <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" className="mr-2" />
          <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
        </div>
      </div>
      <div className="mx-auto h-full sm:w-4/6 lg:w-3/6 xl:w-2/6">
        <div className="h-full w-full flex flex-col items-center justify-center overflow-auto px-7 pb-8 pt-4 sm:px-0">
          <h1 className="text-3xl font-bold">Welcome aboard Plane!</h1>
          <Image src={PlaneTakeOffImage} alt="Plane Logo" className="px-2 py-10" />
          <p className="font-medium text-base text-custom-text-400">
            Get started by setting up your instance and workspace
          </p>
          <Button size="lg" className="w-4/5 my-6">
            Get started
          </Button>
        </div>
      </div>
    </div>
  );
