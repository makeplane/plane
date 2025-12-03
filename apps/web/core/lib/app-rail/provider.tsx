"use client";

import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useLocalStorage from "@/hooks/use-local-storage";
import { AppRailVisibilityContext } from "./context";
import type { IAppRailVisibilityContext } from "./types";

interface AppRailVisibilityProviderProps {
  children: React.ReactNode;
}

/**
 * AppRailVisibilityProvider - manages app rail visibility state
 * The app rail is always available, but can be collapsed by the user
 */
export const AppRailVisibilityProvider = observer(({ children }: AppRailVisibilityProviderProps) => {
  // router
  const { workspaceSlug } = useParams();

  // User preference from localStorage
  const { storedValue: isCollapsed, setValue: setIsCollapsed } = useLocalStorage<boolean>(
    `APP_RAIL_${workspaceSlug}`,
    false // Default: not collapsed (app rail visible)
  );

  const toggleAppRail = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  // Compute final visibility: enabled and not collapsed
  const shouldRenderAppRail = !isCollapsed;

  const value: IAppRailVisibilityContext = useMemo(
    () => ({
      isCollapsed: isCollapsed ?? false,
      shouldRenderAppRail,
      toggleAppRail,
    }),
    [isCollapsed, shouldRenderAppRail, toggleAppRail]
  );

  return <AppRailVisibilityContext.Provider value={value}>{children}</AppRailVisibilityContext.Provider>;
});
