/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";
import type { IAppRailVisibilityContext } from "./types";

/**
 * Context for app-rail visibility control
 * Provides access to app rail enabled state, collapse state, and toggle function
 */
export const AppRailVisibilityContext = createContext<IAppRailVisibilityContext | undefined>(undefined);

/**
 * Hook to consume the AppRailVisibilityContext
 * Must be used within an AppRailVisibilityProvider
 *
 * @returns The app rail visibility context
 * @throws Error if used outside of AppRailVisibilityProvider
 */
export const useAppRailVisibility = (): IAppRailVisibilityContext => {
  const context = useContext(AppRailVisibilityContext);
  if (context === undefined) {
    throw new Error("useAppRailVisibility must be used within AppRailVisibilityProvider");
  }
  return context;
};
