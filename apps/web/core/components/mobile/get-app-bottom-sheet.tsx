/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { X } from "lucide-react";
// components
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";
// constants
import { ANDROID_PLAY_STORE_URL } from "@plane/constants";
// hooks
import { useMobileAppInstall } from "@/hooks/mobile/use-app-install";
// assets
import planeLogoDark from "@/app/assets/icons/icon-512x512.png?url";
import getAppSheetDarkBg from "@/app/assets/mobile/get-app-sheet-dark-bg.svg?url";
import getAppSheetLightBg from "@/app/assets/mobile/get-app-sheet-light-bg.svg?url";

const SESSION_STORAGE_KEY = "get_mobile_app_prompt_shown";

export const GetMobileAppBottomSheet = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { resolvedTheme } = useTheme();
  const { isAndroid, isAppInstalled, intentUrl, isRestrictedRoute } = useMobileAppInstall();

  useEffect(() => {
    if (!isAndroid || isRestrictedRoute) return;
    const hasBeenShown = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!hasBeenShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAndroid, isRestrictedRoute]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible || !isAndroid || isRestrictedRoute) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClose();
          }
        }}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-surface-1 rounded-t-2xl shadow-xl transition-transform duration-300 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-layer-1 relative flex flex-col items-center h-30 rounded-t-2xl">
          <div className="w-13 border-lg border-strong mt-1 top-0 rounded-full" />
          <img
            src={resolvedTheme === "dark" ? getAppSheetDarkBg : getAppSheetLightBg}
            alt="Get App Sheet Background"
            className="absolute w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-2 right-2 p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="size-4 text-tertiary" />
          </button>

          <img src={planeLogoDark} alt="Plane Logo" className="mt-8 size-14 object-contain rounded-2xl" />
        </div>

        <div className="px-6 pb-8 pt-4">
          <div className="flex flex-col items-center text-center gap-6">
            <p className="text-body-sm-medium text-tertiary text-center">
              Keep your projects moving with our mobile app.
            </p>

            <div className="w-full flex flex-col gap-2">
              <a
                target="_blank"
                rel="noreferrer noopener"
                href={isAppInstalled ? intentUrl : (ANDROID_PLAY_STORE_URL as string)}
                className={cn(getButtonStyling("primary", "xl"), "w-full rounded-lg font-medium")}
                onClick={handleClose}
              >
                {isAppInstalled ? "Open App" : "Get App"}
              </a>

              <button
                onClick={handleClose}
                className="w-full py-2 text-body-sm-medium text-primary hover:text-primary transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
