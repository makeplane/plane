"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@plane/propel/button";
// assets
import InstanceFailureDarkImage from "@/app/assets/instance/instance-failure-dark.svg?url";
import InstanceFailureImage from "@/app/assets/instance/instance-failure.svg?url";

export const InstanceFailureView: React.FC = () => {
  const { resolvedTheme } = useTheme();

  const instanceImage = resolvedTheme === "dark" ? InstanceFailureDarkImage : InstanceFailureImage;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="relative h-screen overflow-x-hidden overflow-y-auto container px-5 mx-auto flex justify-center items-center">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <Image src={instanceImage} alt="Plane instance failure image" />
          <h3 className="font-medium text-2xl text-white ">Unable to fetch instance details.</h3>
          <p className="font-medium text-base text-center">
            We were unable to fetch the details of the instance. <br />
            Fret not, it might just be a connectivity work items.
          </p>
        </div>
        <div className="flex justify-center">
          <Button size="md" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
};
