import Link from "next/link";
import { useTheme } from "next-themes";
// icons
import { Lightbulb } from "lucide-react";
// images
import latestFeatures from "@/app/assets/onboarding/onboarding-pages.webp?url";

export function LatestFeatureBlock() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <div className="mx-auto mt-16 flex rounded-[3.5px] border border-subtle bg-surface-1 py-2 sm:w-96">
        <Lightbulb className="mx-3 mr-2 h-7 w-7" />
        <p className="text-left text-13 text-primary">
          Pages gets a facelift! Write anything and use Galileo to help you start.{" "}
          <Link href="https://plane.so/changelog" target="_blank" rel="noopener noreferrer">
            <span className="text-13 font-medium underline hover:cursor-pointer">Learn more</span>
          </Link>
        </p>
      </div>
      <div
        className={`mx-auto mt-8 overflow-hidden rounded-md border border-subtle object-cover sm:h-52 sm:w-96 ${
          resolvedTheme === "dark" ? "bg-surface-1" : "bg-layer-2"
        }`}
      >
        <div className="h-[90%]">
          <img
            src={latestFeatures}
            alt="Plane Work items"
            className={`-mt-2 ml-10 h-full rounded-md ${resolvedTheme === "dark" ? "bg-surface-1" : "bg-layer-2"}`}
          />
        </div>
      </div>
    </>
  );
}
