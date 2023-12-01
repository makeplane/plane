import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
// icons
import { Lightbulb } from "lucide-react";
// images
import latestFeatures from "public/onboarding/onboarding-pages.svg";

export const LatestFeatureBlock = () => {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <div className="flex py-2 bg-onboarding-background-100 border border-onboarding-border-200 mx-auto rounded-[3.5px] sm:w-96 mt-16">
        <Lightbulb className="h-7 w-7 mr-2 mx-3" />
        <p className="text-sm text-left text-onboarding-text-100">
          Pages gets a facelift! Write anything and use Galileo to help you start.{" "}
          <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
            <span className="font-medium text-sm underline hover:cursor-pointer">Learn more</span>
          </Link>
        </p>
      </div>
      <div className="border border-onboarding-border-200 sm:w-96 sm:h-52 object-cover mt-8 mx-auto rounded-md bg-onboarding-background-100 overflow-hidden">
        <div className="h-[90%]">
          <Image
            src={latestFeatures}
            alt="Plane Issues"
            className={`rounded-md h-full ml-8 -mt-2 ${
              resolvedTheme === "dark" ? "bg-onboarding-background-100" : "bg-custom-primary-70"
            } `}
          />
        </div>
      </div>
    </>
  );
};
