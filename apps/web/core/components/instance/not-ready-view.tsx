/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { GOD_MODE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { PlaneLockup } from "@plane/propel/icons";
// assets
import PlaneBackgroundPatternDark from "@/app/assets/auth/background-pattern-dark.svg?url";
import PlaneBackgroundPattern from "@/app/assets/auth/background-pattern.svg?url";
import PlaneTakeOffImage from "@/app/assets/plane-takeoff.png?url";

export function InstanceNotReady() {
  const { resolvedTheme } = useTheme();
  const patternBackground = resolvedTheme === "dark" ? PlaneBackgroundPatternDark : PlaneBackgroundPattern;

  return (
    <div className="relative">
      <div className="flex h-screen w-full flex-col overflow-hidden overflow-y-auto">
        <div className="z-50 container mx-auto flex h-[110px] flex-shrink-0 items-center justify-between gap-5 px-5 lg:px-0">
          <div className="flex items-center gap-x-2 py-10">
            <Link href={`/`}>
              <PlaneLockup className="h-7 w-auto text-primary" />
            </Link>
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          <img src={patternBackground} className="h-full w-full object-cover" alt="Plane background pattern" />
        </div>

        <div className="relative z-10 mb-[110px] flex-grow">
          <div className="relative container mx-auto flex h-full w-full items-center justify-center px-5">
            <div className="relative w-auto max-w-2xl space-y-8 py-10">
              <div className="relative flex flex-col items-center justify-center space-y-4">
                <h1 className="pb-3 text-24 font-bold">Welcome aboard Plane!</h1>
                <img src={PlaneTakeOffImage} className="h-full w-full object-cover" alt="Plane Logo" />
                <p className="text-14 font-medium text-placeholder">
                  Get started by setting up your instance and workspace
                </p>
              </div>
              <div>
                <a href={GOD_MODE_URL}>
                  <Button size="xl" className="w-full">
                    Get started
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
