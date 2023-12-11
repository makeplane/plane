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
      <div className="mx-auto mt-16 flex rounded-[3.5px] border border-onboarding-border-200 bg-onboarding-background-100 py-2 sm:w-96">
        <Lightbulb className="mx-3 mr-2 h-7 w-7" />
        <p className="text-left text-sm text-onboarding-text-100">
          Pages gets a facelift! Write anything and use Galileo to help you start.{" "}
          <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
            <span className="text-sm font-medium underline hover:cursor-pointer">Learn more</span>
          </Link>
        </p>
      </div>
      <div
        className={`mx-auto mt-8 overflow-hidden rounded-md border border-onboarding-border-200 object-cover sm:h-52 sm:w-96 ${
          resolvedTheme === "dark" ? "bg-onboarding-background-100" : "bg-custom-primary-70"
        }`}
      >
        <div className="h-[90%]">
          <Image
            src={latestFeatures}
            alt="Plane Issues"
            className={`-mt-2 ml-10 h-full rounded-md ${
              resolvedTheme === "dark" ? "bg-onboarding-background-100" : "bg-custom-primary-70"
            }`}
          />
        </div>
      </div>
    </>
  );
};
