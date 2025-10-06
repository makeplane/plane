import { useCallback } from "react";
import { useTheme } from "next-themes";
import { Calendar, Earth, Languages, Palette } from "lucide-react";
// plane imports
import { EStartOfTheWeek, TUserProfile } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useUser, useUserProfile } from "@/hooks/store/user";

/**
 * Preferences commands - Preferences related commands
 */
export const usePowerKPreferencesCommands = (): TPowerKCommandConfig[] => {
  // store hooks
  const { setTheme } = useTheme();
  const { updateCurrentUser } = useUser();
  const { updateUserProfile, updateUserTheme } = useUserProfile();

  const handleUpdateTheme = useCallback(
    async (newTheme: string) => {
      setTheme(newTheme);
      return updateUserTheme({ theme: newTheme }).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Failed to save user theme settings!",
        });
      });
    },
    [setTheme, updateUserTheme]
  );

  const handleUpdateTimezone = useCallback(
    (value: string) => {
      updateCurrentUser({ user_timezone: value })
        .then(() => {
          setToast({
            title: "Success!",
            message: "Timezone updated successfully",
            type: TOAST_TYPE.SUCCESS,
          });
        })
        .catch(() => {
          setToast({
            title: "Error!",
            message: "Failed to update timezone",
            type: TOAST_TYPE.ERROR,
          });
        });
    },
    [updateCurrentUser]
  );

  const handleUpdateUserProfile = useCallback(
    (payload: Partial<TUserProfile>) => {
      updateUserProfile(payload)
        .then(() => {
          setToast({
            title: "Success!",
            message: "Language updated successfully",
            type: TOAST_TYPE.SUCCESS,
          });
        })
        .catch(() => {
          setToast({
            title: "Error!",
            message: "Failed to update language",
            type: TOAST_TYPE.ERROR,
          });
        });
    },
    [updateUserProfile]
  );

  return [
    {
      id: "update-interface-theme",
      group: "preferences",
      type: "change-page",
      page: "update-theme",
      i18n_title: "power_k.preferences_actions.update_theme",
      icon: Palette,
      onSelect: (data) => {
        const theme = data as string;
        handleUpdateTheme(theme);
      },
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "update-timezone",
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
      id: "update-start-of-week",
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
      id: "update-interface-language",
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
