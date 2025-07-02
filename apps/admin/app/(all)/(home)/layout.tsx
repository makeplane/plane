"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
// logo assets
import PlaneBackgroundPatternDark from "public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "public/auth/background-pattern.svg";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.png";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  const patternBackground = resolvedTheme === "light" ? PlaneBackgroundPattern : PlaneBackgroundPatternDark;
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
        <div className="relative z-10 flex-grow">{children}</div>
      </div>
    </div>
  );
}
