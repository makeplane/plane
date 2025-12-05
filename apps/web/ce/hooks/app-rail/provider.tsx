"use client";

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
export const AppRailVisibilityProvider = observer(({ children }: AppRailVisibilityProviderProps) => (
  <CoreProvider isEnabled={false}>{children}</CoreProvider>
));
