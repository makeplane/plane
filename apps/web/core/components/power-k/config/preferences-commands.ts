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

import { useCallback } from "react";
import { useTheme } from "next-themes";
import { Calendar, Earth, Languages, Palette } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { EStartOfTheWeek, TUserProfile } from "@plane/types";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";
import { isDesktop } from "@/hooks/use-desktop";

/**
 * Preferences commands - Preferences related commands
 */
export const usePowerKPreferencesCommands = (): TPowerKCommandConfig[] => {
  // store hooks
  const { setTheme } = useTheme();
  const { updateCurrentUser } = useUser();
  const { updateUserProfile, updateUserTheme } = useUserProfile();
  // translation
  const { t } = useTranslation();

  const handleUpdateTheme = useCallback(
    async (newTheme: string) => {
      setTheme(newTheme);
      return updateUserTheme({ theme: newTheme })
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Theme updated",
            message: "Reloading to apply changes...",
          });
          // reload the page after showing the toast
          window.location.reload();
          return;
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("power_k.preferences_actions.toast.theme.error"),
          });
          return;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setTheme, updateUserTheme]
  );

  const handleUpdateTimezone = useCallback(
    (value: string) => {
      updateCurrentUser({ user_timezone: value })
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("power_k.preferences_actions.toast.timezone.success"),
          });
          return;
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("power_k.preferences_actions.toast.timezone.error"),
          });
          return;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateCurrentUser]
  );

  const handleUpdateUserProfile = useCallback(
    (payload: Partial<TUserProfile>) => {
      updateUserProfile(payload)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("toast.success"),
            message: t("power_k.preferences_actions.toast.generic.success"),
          });
          return;
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("power_k.preferences_actions.toast.generic.error"),
          });
          return;
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateUserProfile]
  );

  return [
    {
      id: "update_interface_theme",
      group: "preferences",
      type: "change-page",
      page: "update-theme",
      i18n_title: "power_k.preferences_actions.update_theme",
      icon: Palette,
      onSelect: (data) => {
        const theme = data as string;
        void handleUpdateTheme(theme);
      },
      // THEME: temporarily disable the theme switcher on desktop since it's not supported yet
      isEnabled: () => !isDesktop(),
      isVisible: () => !isDesktop(),
      closeOnSelect: true,
    },
    {
      id: "update_timezone",
      group: "preferences",
      page: "update-timezone",
      type: "change-page",
      i18n_title: "power_k.preferences_actions.update_timezone",
      icon: Earth,
      onSelect: (data) => {
        const timezone = data as string;
        handleUpdateTimezone(timezone);
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "update_start_of_week",
      group: "preferences",
      page: "update-start-of-week",
      type: "change-page",
      i18n_title: "power_k.preferences_actions.update_start_of_week",
      icon: Calendar,
      onSelect: (data) => {
        const startOfWeek = data as EStartOfTheWeek;
        handleUpdateUserProfile({ start_of_the_week: startOfWeek });
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "update_interface_language",
      group: "preferences",
      page: "update-language",
      type: "change-page",
      i18n_title: "power_k.preferences_actions.update_language",
      icon: Languages,
      onSelect: (data) => {
        const language = data as string;
        handleUpdateUserProfile({ language });
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
