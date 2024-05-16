"use client";

import { observer } from "mobx-react-lite";
import Image from "next/image";
// ui
import { useTheme } from "next-themes";
// components
import { AuthRoot } from "@/components/accounts";
// images
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text-new.png";

export const AuthView = observer(() => {
  // hooks
  const { resolvedTheme } = useTheme();

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
          className="w-full h-full object-cover"
          alt="Plane background pattern"
        />
      </div>
      <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
        <div className="container mx-auto px-10 lg:px-0 flex-shrink-0 relative flex items-center justify-between pb-4 transition-all">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
        </div>
        <div className="flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 py-10">
          <AuthRoot />
        </div>
      </div>
    </div>
  );
});
