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

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import type { TInitiativeScopeTab } from "@plane/types";
import { observer } from "mobx-react";

type InitiativeScopeSharedContextType = {
  activeTab: TInitiativeScopeTab;
  isReady: boolean;
};

const InitiativeScopeSharedContext = createContext<InitiativeScopeSharedContextType | undefined>(undefined);

type InitiativeScopeSharedProviderProps = {
  children: ReactNode;
  workspaceSlug: string;
  initiativeId: string;
  activeTab: TInitiativeScopeTab;
};

export const InitiativeScopeSharedProvider = observer(function InitiativeScopeSharedProvider({
  children,
  workspaceSlug,
  initiativeId,
  activeTab,
}: InitiativeScopeSharedProviderProps) {
  const isReady = !!(workspaceSlug && initiativeId);

  const value = useMemo(
    () => ({
      activeTab,
      isReady,
    }),
    [activeTab, isReady]
  );

  return <InitiativeScopeSharedContext.Provider value={value}>{children}</InitiativeScopeSharedContext.Provider>;
});

export const useInitiativeScopeShared = () => {
  const context = useContext(InitiativeScopeSharedContext);
  if (!context) {
    throw new Error("useInitiativeScopeShared must be used within InitiativeScopeSharedProvider");
  }
  return context;
};
