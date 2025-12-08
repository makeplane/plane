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
