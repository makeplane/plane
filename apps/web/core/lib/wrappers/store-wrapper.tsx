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
import { useEffect } from "react";
import { reaction } from "mobx";
import { useTheme } from "@plane/react-theme";
// helpers
import { applyCustomTheme, clearCustomTheme } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { useUserProfile } from "@/hooks/store/user";
import { isDesktop, getDesktopAPI } from "@/hooks/use-desktop";

type TStoreWrapper = {
  children: ReactNode;
};

export default function StoreWrapper(props: TStoreWrapper) {
  const { children } = props;
  // theme
  const { setTheme } = useTheme();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const profileStore = useUserProfile();
  const { unreadNotificationsCount } = useWorkspaceNotifications();

  /**
   * Sidebar collapsed fetching from local storage
   */
  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("app_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (localValue && sidebarCollapsed === undefined) toggleSidebar(localBoolValue);
  }, [sidebarCollapsed, toggleSidebar]);

  /**
   * Theme sync from server (one-time per user session).
   *
   * Uses a MobX reaction so the theme updates as soon as the profile
   * observable changes, regardless of React render timing. This is
   * important because the profile is fetched in route middleware which
   * may complete after this component mounts.
   *
   * Priority: API profile > localStorage > system preference.
   * The API theme is written to localStorage so ThemeScript can apply
   * it immediately on subsequent navigations to prevent flicker.
   */
  useEffect(() => {
    if (isDesktop()) {
      setTheme("system");
      return;
    }

    let hasInitialized = false;
    let currentUserId: string | undefined;

    return reaction(
      () => ({
        userId: profileStore.data?.id,
        theme: profileStore.data?.theme?.theme,
      }),
      ({ userId, theme }) => {
        // Reset initialization flag when user changes (logout/login)
        if (userId !== currentUserId) {
          hasInitialized = false;
          currentUserId = userId;
        }

        if (!theme || hasInitialized) return;

        setTheme(theme);
        hasInitialized = true;
      },
      { fireImmediately: true }
    );
  }, [setTheme, profileStore]);

  /**
   * Custom theme CSS application.
   *
   * Uses a MobX reaction to apply or clear custom theme CSS variables
   * whenever the theme changes.
   */
  useEffect(() => {
    if (isDesktop()) return;

    let previousTheme: string | undefined;

    return reaction(
      () => ({
        theme: profileStore.data?.theme?.theme,
        primary: profileStore.data?.theme?.primary,
        background: profileStore.data?.theme?.background,
        darkPalette: profileStore.data?.theme?.darkPalette,
      }),
      ({ theme, primary, background, darkPalette }) => {
        if (!theme) return;

        if (theme === "custom" && primary && background && darkPalette !== undefined) {
          applyCustomTheme(primary, background, darkPalette ? "dark" : "light");
        } else if (previousTheme === "custom" && theme !== "custom") {
          clearCustomTheme();
        }

        previousTheme = theme;
      },
      { fireImmediately: true }
    );
  }, [profileStore]);

  /**
   * Desktop badge count: sync unread notification count to the native app icon.
   * Uses a MobX reaction so the badge updates whenever the observable changes,
   * regardless of which component triggered the update.
   */
  useEffect(() => {
    if (!isDesktop()) return;

    return reaction(
      () => unreadNotificationsCount.total_unread_notifications_count,
      (count) => {
        getDesktopAPI().setBadgeCount?.(count);
      },
      { fireImmediately: true }
    );
  }, [unreadNotificationsCount]);

  return <>{children}</>;
}
