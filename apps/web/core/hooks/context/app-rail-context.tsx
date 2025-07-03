"use client";

import React, { createContext, ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";

export interface AppRailContextType {
  isEnabled: boolean;
  shouldRenderAppRail: boolean;
  toggleAppRail: (value?: boolean) => void;
}

const AppRailContext = createContext<AppRailContextType | undefined>(undefined);

export { AppRailContext };

interface AppRailProviderProps {
  children: ReactNode;
}

export const AppRailProvider = observer(({ children }: AppRailProviderProps) => {
  const { workspaceSlug } = useParams();
  const { storedValue: isAppRailVisible, setValue: setIsAppRailVisible } = useLocalStorage<boolean>(
    `APP_RAIL_${workspaceSlug}`,
    false
  );

  const isEnabled = false;

  const toggleAppRail = (value?: boolean) => {
    if (value === undefined) {
      setIsAppRailVisible(!isAppRailVisible);
    } else {
      setIsAppRailVisible(value);
    }
  };

  const contextValue: AppRailContextType = {
    isEnabled,
    shouldRenderAppRail: !!isAppRailVisible && isEnabled,
    toggleAppRail,
  };

  return <AppRailContext.Provider value={contextValue}>{children}</AppRailContext.Provider>;
});
