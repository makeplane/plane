"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { TInstanceConfig } from "@plane/types";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { AuthRoot } from "@/plane-web/components/mobile";
// assets
import PlaneBackgroundPatternDark from "@/public/auth/background-pattern-dark.svg";
import PlaneBackgroundPattern from "@/public/auth/background-pattern.svg";

const MobileAuth = observer(() => {
  const { resolvedTheme } = useTheme();
  // hooks
  const { config } = useInstance();

  // derived values
  const pageBackgroundPattern = resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern;

  return (
    <div className="isolate relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image src={pageBackgroundPattern} className="w-full h-full object-cover" alt="Plane background pattern" />
      </div>
      <div className="relative z-10 w-screen h-screen overflow-hidden overflow-y-auto flex flex-col">
        <div className="py-5 flex flex-col justify-center flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 transition-all">
          <AuthRoot config={config as TInstanceConfig} />
        </div>
      </div>
    </div>
  );
});

export default MobileAuth;
