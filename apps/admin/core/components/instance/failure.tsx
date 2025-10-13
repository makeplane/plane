"use client";
import type { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "@plane/propel/button";
// assets
import { AuthHeader } from "@/app/(all)/(home)/auth-header";
import InstanceFailureDarkImage from "@/public/instance/instance-failure-dark.svg";
import InstanceFailureImage from "@/public/instance/instance-failure.svg";

export const InstanceFailureView: FC = observer(() => {
  const { resolvedTheme } = useTheme();

  const instanceImage = resolvedTheme === "dark" ? InstanceFailureDarkImage : InstanceFailureImage;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <>
      <AuthHeader />
      <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
        <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
          <div className="relative flex flex-col justify-center items-center space-y-4">
            <Image src={instanceImage} alt="Plane Logo" />
            <h3 className="font-medium text-2xl text-white text-center">Unable to fetch instance details.</h3>
            <p className="font-medium text-base text-center">
              We were unable to fetch the details of the instance. Fret not, it might just be a connectivity issue.
            </p>
          </div>
          <div className="flex justify-center">
            <Button size="md" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});
