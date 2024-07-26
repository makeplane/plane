"use client";
import Image from "next/image";
import { useTheme } from "next-themes";
// assets
import LogoSpinnerDark from "@/public/images/logo-spinner-dark.gif";
import LogoSpinnerLight from "@/public/images/logo-spinner-light.gif";

export const LogoSpinner = () => {
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === "dark" ? LogoSpinnerDark : LogoSpinnerLight;

  return (
    <div className="h-screen w-full flex min-h-[600px] justify-center items-center">
      <div className="flex items-center justify-center">
        <Image src={logoSrc} alt="logo" className="w-[82px] h-[82px] mr-2" />
      </div>
    </div>
  );
};
