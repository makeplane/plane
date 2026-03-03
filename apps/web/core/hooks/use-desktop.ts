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

import { useCallback, useEffect, useState } from "react";

// Check if running in desktop app
export const isDesktop = (): boolean => typeof window !== "undefined" && !!window.planeDesktop;

// Get the desktop API (throws if not in desktop)
export const getDesktopAPI = () => {
  if (!window.planeDesktop) {
    throw new Error("Not running in desktop app");
  }
  return window.planeDesktop;
};

// Hook to manage instance URL
export const useDesktopInstance = () => {
  const [instanceUrl, setInstanceUrlState] = useState<string | null>(null);

  useEffect(() => {
    if (!isDesktop()) return;

    void getDesktopAPI()
      .getInstanceUrl()
      .then((url) => setInstanceUrlState(url));
  }, []);

  const setInstanceUrl = useCallback((url: string) => {
    if (isDesktop()) {
      getDesktopAPI().setInstanceUrl(url);
      setInstanceUrlState(url);
    }
  }, []);

  return {
    instanceUrl,
    setInstanceUrl,
    needsSetup: isDesktop() && !instanceUrl,
  };
};

// Hook for desktop utilities
export const useDesktop = () => {
  const instance = useDesktopInstance();

  return {
    isDesktop: isDesktop(),
    platform: isDesktop() ? getDesktopAPI().platform : null,
    instance,
    openExternal: useCallback((url: string) => {
      if (isDesktop()) {
        getDesktopAPI().openExternal(url);
      } else {
        window.open(url, "_blank");
      }
    }, []),
  };
};
