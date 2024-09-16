"use client";

import { createContext, useEffect, useState, useMemo, useCallback } from "react";
// todesktop
import { nativeWindow, webContents } from "@todesktop/client-core";
// mobx
import { observer } from "mobx-react";

export type TDesktopAppContext = {
  pageTitle: string;
  isFullScreen: boolean;
};

export const DesktopAppContext = createContext<TDesktopAppContext | undefined>(undefined);

export type TDesktopAppProviderProps = {
  children: React.ReactNode;
};

export const DesktopAppProvider = observer((props: TDesktopAppProviderProps) => {
  const { children } = props;
  // states
  const [pageTitle, setPageTitle] = useState<string>(document.title);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // handle theme change
  const handleThemeChange = useCallback(() => {
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("bg-custom-background-100/90", currentTheme === "custom");
  }, []);

  useEffect(() => {
    const cleanupFunctions: (() => Promise<void> | void)[] = [];

    // Setup observers
    const setupTitleChangeObserver = async () => {
      const unsubscribe = await webContents.on("page-title-updated", () => {
        setPageTitle(document.title);
      });
      cleanupFunctions.push(unsubscribe);
    };

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
    setupTitleChangeObserver();
    setupFullScreenObservers();
    setupThemeObserver();

    return () => {
      // Cleanup observers
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [handleThemeChange]);

  const contextValue = useMemo(() => ({ pageTitle, isFullScreen }), [pageTitle, isFullScreen]);

  return <DesktopAppContext.Provider value={contextValue}>{children}</DesktopAppContext.Provider>;
});
