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

import { createContext, useEffect, useState, useMemo, useCallback } from "react";
// todesktop
import { nativeWindow } from "@todesktop/client-core";
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
// mobx
import { observer } from "mobx-react";

export type TDesktopAppContext = {
  isFullScreen: boolean;
};

export const DesktopAppContext = createContext<TDesktopAppContext | undefined>(undefined);

export type TDesktopAppProviderProps = {
  children: React.ReactNode;
};

export const DesktopAppProvider = observer(function DesktopAppProvider(props: TDesktopAppProviderProps) {
  const { children } = props;
  // states
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  // derived
  // handle theme change
  const handleThemeChange = useCallback(() => {
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("bg-surface-1/90", currentTheme === "custom");
  }, []);

  useEffect(() => {
    if (!isDesktopApp()) return;

    const cleanupFunctions: (() => Promise<void> | void)[] = [];

    // Setup observers
    const setupFullScreenObservers = async () => {
      setIsFullScreen(await nativeWindow.isFullscreen());

      const unsubscribeEnter = await nativeWindow.on("enter-full-screen", () => setIsFullScreen(true));
      const unsubscribeExit = await nativeWindow.on("leave-full-screen", () => setIsFullScreen(false));

      cleanupFunctions.push(unsubscribeEnter, unsubscribeExit);
    };

    const setupThemeObserver = () => {
      const themeObserver = new MutationObserver(handleThemeChange);
      themeObserver.observe(document.documentElement, {
        attributeFilter: ["data-theme"],
        attributeOldValue: true,
      });
      cleanupFunctions.push(() => themeObserver.disconnect());
    };

    // Call observers
    handleThemeChange();
    setupFullScreenObservers();
    setupThemeObserver();

    return () => {
      // Cleanup observers
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [handleThemeChange]);

  const contextValue = useMemo(() => ({ isFullScreen }), [isFullScreen]);

  return <DesktopAppContext.Provider value={contextValue}>{children}</DesktopAppContext.Provider>;
});
