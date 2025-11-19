"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

import AhaWhiteLogo from "@/public/aha-logos/white-horizontal-with-logo.png";
import AhaBlackLogo from "@/public/aha-logos/black-horizontal-with-logo.png";

export const AuthHeader = () => {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === "dark" ? AhaWhiteLogo : AhaBlackLogo;

  return (
    <div className="flex items-center justify-between gap-6 w-full flex-shrink-0 sticky top-0 py-6">
      <Link href="/">
        <Image src={logoSrc} alt="AHA Projects logo" className="h-14 w-auto sm:h-16" priority />
      </Link>
    </div>
  );
};
