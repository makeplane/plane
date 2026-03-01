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

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { usePlatformOS } from "@plane/hooks";
// constants
import { ANDROID_APP_ID, ANDROID_PLAY_STORE_URL } from "@plane/constants";

// Routes on which the mobile app banner should not be shown
const RESTRICTED_ROUTES = ["m/auth"];

export function useMobileAppInstall() {
  const [isAppInstalled, setIsAppInstalled] = useState<boolean | null>(null);
  const { isMobile, platform } = usePlatformOS();
  const isAndroid = isMobile && platform === "Android";
  const location = useLocation();
  const pathname = location.pathname;

  const isRestrictedRoute = useMemo(() => {
    return RESTRICTED_ROUTES.some((route) => pathname.includes(route));
  }, [pathname]);

  useEffect(() => {
    if (!isAndroid || isRestrictedRoute) return;

    const checkAppInstall = async (): Promise<boolean> => {
      try {
        if (!navigator.getInstalledRelatedApps) return false;
        const apps = await navigator.getInstalledRelatedApps();
        return apps.some((app) => app.id === ANDROID_APP_ID);
      } catch {
        return false;
      }
    };

    checkAppInstall()
      .then(setIsAppInstalled)
      .catch(() => setIsAppInstalled(false));
  }, [isAndroid, isRestrictedRoute]);

  const intentUrl =
    "intent://launcher" +
    "#Intent;" +
    "scheme=com.plane.so;" +
    `package=${ANDROID_APP_ID};` +
    `S.browser_fallback_url=${ANDROID_PLAY_STORE_URL};` +
    "end";

  return {
    isAppInstalled,
    isAndroid,
    intentUrl,
    isRestrictedRoute,
  };
}
