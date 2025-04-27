"use client";

import React from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { useTranslation } from "@plane/i18n";
import { useEventTracker } from "@/hooks/store";
import { NAVIGATE_TO_SIGNUP } from "@plane/constants";


// ui
import { Button } from "@plane/ui";
import { useTheme } from "next-themes";

// images
import Image404 from "@/public/new404.png";
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";
import BlackHorizontalLogo from "@/public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "@/public/plane-logos/white-horizontal-with-blue-logo.png";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
};

const PageNotFound = (() => {
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { captureEvent } = useEventTracker();

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;
  
  return (
    <div className="h-screen w-full overflow-hidden bg-custom-background-100 flex flex-col">
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern}
          className="w-full h-full object-cover"
          alt="Plane background pattern"
        />
      </div>
  
      {/* Top Navigation */}
      <div className="container min-w-full px-10 lg:px-20 xl:px-36 flex-shrink-0 relative flex items-center justify-between pb-4 transition-all">
        <div className="flex items-center gap-x-2 py-10">
          <Link href="/" className="h-[30px] w-[133px]">
            <Image src={logo} alt="Plane logo" />
          </Link>
        </div>
        <div className="flex flex-col items-end sm:items-center sm:gap-2 sm:flex-row text-center text-sm font-medium text-onboarding-text-300">
          {t("auth.common.new_to_plane")}
          <Link
            href="/sign-up"
            onClick={() => captureEvent(NAVIGATE_TO_SIGNUP, {})}
            className="font-semibold text-custom-primary-100 hover:underline"
          >
            {t("auth.common.create_account")}
          </Link>
        </div>
      </div>
  
      {/* 404 Content */}
      <div className="grid h-full items-start justify-center pt-24 p-4 z-10">        
        <div className="space-y-8 text-center">
          {/* Image */}.
          
    <div className="mx-auto h-200 w-80 lg:h-80 lg:w-100 relative">
  <Image
    src={Image404}
    alt="404 - Page not found"
    fill
    className="object-contain"
    priority
  />
</div>

<div className="space-y-2 relative z-10">
  <h3 className="text-lg font-semibold">Oops! Something went wrong.</h3>
  <p className="text-sm text-custom-text-200">
    Sorry, the page you are looking for cannot be found. It may have been removed, had its name changed, or is
    temporarily unavailable.
  </p>
</div>

        </div>
      </div>
    </div>
  </div>
  
);
});


export default PageNotFound;
