import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@plane/ui";
// helpers
import { GOD_MODE_URL } from "@/helpers/common.helper";
// images
import PlaneTakeOffImage from "@/public/plane-takeoff.png";
// assets
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.png";

export const InstanceNotReady: FC = () => {
  const { resolvedTheme } = useTheme();
  const patternBackground = resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern;

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <div className="relative">
      <div className="h-screen w-full overflow-hidden overflow-y-auto flex flex-col">
        <div className="container h-[110px] flex-shrink-0 mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
          <div className="flex items-center gap-x-2 py-10">
            <Link href={`/`} className="h-[30px] w-[133px]">
              <Image src={logo} alt="Plane logo" />
            </Link>
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          <Image src={patternBackground} className="w-screen h-full object-cover" alt="Plane background pattern" />
        </div>

        <div className="relative z-10 mb-[110px] flex-grow">
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
                <a href={GOD_MODE_URL}>
                  <Button size="lg" className="w-full">
                    Get started
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
