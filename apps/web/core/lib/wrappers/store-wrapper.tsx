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
import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import type { TLanguage } from "@plane/i18n";
import { useTranslation } from "@plane/i18n";
// helpers
import { applyCustomTheme, clearCustomTheme } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUserProfile } from "@/hooks/store/user";
import { isDesktop } from "@/hooks/use-desktop";

type TStoreWrapper = {
  children: ReactNode;
};

function StoreWrapper(props: TStoreWrapper) {
  const { children } = props;
  // theme
  const { setTheme } = useTheme();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { data: userProfile } = useUserProfile();
  const { changeLanguage } = useTranslation();

  // Track if we've initialized theme from server (one-time only)
  const hasInitializedThemeRef = useRef(false);
  // Track current user to reset on logout/login
  const currentUserIdRef = useRef<string | undefined>(undefined);
  // Track previous theme to detect transitions from custom theme
  const previousThemeRef = useRef<string | undefined>(undefined);

  /**
   * Sidebar collapsed fetching from local storage
   */
  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("app_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (localValue && sidebarCollapsed === undefined) toggleSidebar(localBoolValue);
  }, [sidebarCollapsed, setTheme, toggleSidebar]);

  /**
   * Effect 1: Initial theme sync from server (one-time only)
   *
   * This effect runs ONCE per user session to load theme from server.
   * After initial load, all theme changes are localStorage-driven (next-themes).
   * This prevents a feedback loop where server updates trigger UI updates in a cycle.
   */
  useEffect(() => {
    // THEME: fallback to system theme for desktop app
    if (isDesktop()) {
      setTheme("system");
      return;
    }

    const userId = userProfile?.id;

    // Reset initialization flag when user changes (logout/login)
    // This handles both logout (userId becomes undefined) and login (userId changes)
    if (userId !== currentUserIdRef.current) {
      hasInitializedThemeRef.current = false;
      previousThemeRef.current = undefined;
      currentUserIdRef.current = userId;
    }

    // Only initialize theme from server on FIRST load for this user
    if (!userProfile?.theme?.theme || hasInitializedThemeRef.current) {
      return; // Skip if already initialized or no profile data
    }

    // Apply theme from server profile (one-time only)
    setTheme(userProfile?.theme?.theme || "system");

    // Mark as initialized - prevents future syncs from server
    hasInitializedThemeRef.current = true;
  }, [userProfile?.theme?.theme, setTheme]);

  /**
   * Effect 2: Custom theme CSS application (runs on every change)
   *
   * This effect applies or clears custom theme CSS variables whenever
   * the theme changes. It runs independently of the initial sync effect.
   */
  useEffect(() => {
    // THEME: fallback to system theme for desktop app
    if (isDesktop()) return;

    if (!userProfile?.theme?.theme) return;

    const currentTheme = userProfile?.theme?.theme;
    const previousTheme = previousThemeRef.current;
    const themeData = userProfile?.theme;

    // Apply custom theme if current theme is custom
    if (currentTheme === "custom" && themeData.primary && themeData.background && themeData.darkPalette !== undefined) {
      applyCustomTheme(themeData.primary, themeData.background, themeData.darkPalette ? "dark" : "light");
    }
    // Clear custom theme CSS when switching away from custom
    else if (previousTheme === "custom" && currentTheme !== "custom") {
      clearCustomTheme();
      // No reload needed - let CSS cascade handle it naturally
    }

    // Update previous theme for next comparison
    previousThemeRef.current = currentTheme;
  }, [userProfile?.theme]);

  useEffect(() => {
    if (!userProfile?.language) return;
    changeLanguage(userProfile?.language as TLanguage);
  }, [userProfile?.language, changeLanguage]);

  return <>{children}</>;
}

export default observer(StoreWrapper);
