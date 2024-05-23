"use client";

import { observer } from "mobx-react-lite";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
// components
import { AuthRoot } from "@/components/account";
// helpers
import { SPACE_BASE_PATH } from "@/helpers/common.helper";
// images
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.png";

export const AuthView = observer(() => {
  // hooks
  const { resolvedTheme } = useTheme();

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

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
            <Link href={`${SPACE_BASE_PATH}/`} className="h-[30px] w-[133px]">
              <Image src={logo} alt="Plane logo" />
            </Link>
          </div>
        </div>
        <div className="flex flex-col justify-center flex-grow container h-[100vh-60px] mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 transition-all">
          <AuthRoot />
        </div>
      </div>
    </div>
  );
});
