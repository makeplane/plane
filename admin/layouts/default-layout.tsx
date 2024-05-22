"use client";

import { FC, ReactNode } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// logo/ images
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

type TDefaultLayout = {
  children: ReactNode;
  withoutBackground?: boolean;
};

export const DefaultLayout: FC<TDefaultLayout> = (props) => {
  const { children, withoutBackground = false } = props;
  // hooks
  const { resolvedTheme } = useTheme();
  const patternBackground = resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern;

  return (
    <div className="relative">
      <div className="h-screen w-full overflow-hidden overflow-y-auto flex flex-col">
        <div className="container h-[110px] flex-shrink-0 mx-auto px-5 lg:px-0 flex items-center justify-between gap-5 z-50">
          <div className="flex items-center gap-x-2 py-10">
            <Image src={BluePlaneLogoWithoutText} height={30} width={30} alt="Plane Logo" />
            <span className="text-2xl font-semibold sm:text-3xl">Plane</span>
          </div>
        </div>
        {!withoutBackground && (
          <div className="absolute inset-0 z-0">
            <Image src={patternBackground} className="w-screen h-full object-cover" alt="Plane background pattern" />
          </div>
        )}
        <div className="relative z-10 flex-grow">{children}</div>
      </div>
    </div>
  );
};
