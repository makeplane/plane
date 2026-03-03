/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { AppRailVisibilityProvider as CoreProvider } from "@/lib/app-rail";

interface AppRailVisibilityProviderProps {
  children: React.ReactNode;
}

/**
 * CE AppRailVisibilityProvider
 * Wraps core provider with isEnabled hardcoded to false
 */
export const AppRailVisibilityProvider = observer(function AppRailVisibilityProvider({
  children,
}: AppRailVisibilityProviderProps) {
  return <CoreProvider isEnabled={false}>{children}</CoreProvider>;
});
