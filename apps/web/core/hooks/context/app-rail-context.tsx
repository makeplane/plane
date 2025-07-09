"use client";

import React, { createContext, ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EProductSubscriptionEnum } from "@plane/types";
// hooks
import useLocalStorage from "@/hooks/use-local-storage";
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";

export interface AppRailContextType {
  isEnabled: boolean;
  shouldRenderAppRail: boolean;
  toggleAppRail: (value?: boolean) => void;
}

export const AppRailContext = createContext<AppRailContextType | undefined>(undefined);

interface AppRailProviderProps {
  children: ReactNode;
}

export const AppRailProvider = observer(({ children }: AppRailProviderProps) => {
  const { workspaceSlug } = useParams();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  const defaultAppRailVisibility = subscriptionDetail?.product !== EProductSubscriptionEnum.FREE;

  const { storedValue: isAppRailVisible, setValue: setIsAppRailVisible } = useLocalStorage<boolean>(
    `APP_RAIL_${workspaceSlug}`,
    defaultAppRailVisibility
  );
  const isFeatureFlagEnabled = useFlag(workspaceSlug?.toString(), "APP_RAIL");

  const isSelfManaged = !!subscriptionDetail?.is_self_managed;
  const currentSubscription = subscriptionDetail?.product;
  const isEnabled = isFeatureFlagEnabled && (!isSelfManaged || currentSubscription !== EProductSubscriptionEnum.FREE);

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
