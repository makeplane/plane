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

// components
import { getButtonStyling } from "@plane/propel/button";
// utils
import { cn } from "@plane/utils";
// constants
import { ANDROID_PLAY_STORE_URL } from "@plane/constants";
// hooks
import { useMobileAppInstall } from "@/hooks/mobile/use-app-install";
// assets
import planeLogoDark from "@/app/assets/icons/icon-512x512.png?url";

export const GetMobileAppBanner = () => {
  const { isAndroid, isAppInstalled, intentUrl, isRestrictedRoute } = useMobileAppInstall();

  if (!isAndroid || isRestrictedRoute) return null;

  return (
    <div className="flex px-4 py-3 items-center bg-surface-1 border-b border-border-1 border-subtle">
      <div className="w-full flex gap-3 overflow-hidden items-center">
        <img src={planeLogoDark} alt="Plane Logo" className="size-10 object-contain rounded-xl shrink-0" />
        <div className="flex items-center justify-between w-full gap-2">
          <div>
            <p className="text-h6-medium">Plane</p>
            <p className="text-13 text-tertiary">The official app by Plane</p>
          </div>
        </div>
        <a
          target="_blank"
          rel="noreferrer noopener"
          href={isAppInstalled ? intentUrl : (ANDROID_PLAY_STORE_URL as string)}
          className={cn(getButtonStyling("primary", "sm"), "rounded-full px-2 py-3 bg-accent-primary-active")}
        >
          {isAppInstalled ? "Open App" : "Get App"}
        </a>
      </div>
    </div>
  );
};
