import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@plane/ui";
// images
import PlaneBlackLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.svg";
import PlaneWhiteLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.svg";
import PlaneTakeOffImage from "@/public/plane-takeoff.png";

export const InstanceNotReady: FC = () => {
  const { resolvedTheme } = useTheme();

  const planeLogo = resolvedTheme === "dark" ? PlaneWhiteLogo : PlaneBlackLogo;

  return (
    <div className="relative h-screen max-h-max w-full overflow-hidden overflow-y-auto flex flex-col">
      <div className="flex-shrink-0 h-[120px]">
        <div className="relative h-full container mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
          <div className="flex items-center gap-x-2">
            <Image src={planeLogo} className="h-[24px] w-full" alt="Plane logo" />
          </div>
        </div>
      </div>
      <div className="w-full flex-grow">
        <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center">
          <div className="w-auto max-w-2xl relative space-y-8 py-10">
            <div className="relative flex flex-col justify-center items-center space-y-4">
              <h1 className="text-3xl font-bold pb-3">Welcome aboard Plane!</h1>
              <Image src={PlaneTakeOffImage} alt="Plane Logo" />
              <p className="font-medium text-base text-custom-text-400">
                Get started by setting up your instance and workspace
              </p>
            </div>
            <div>
              <Link href={"/god-mode/"}>
                <Button size="lg" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
