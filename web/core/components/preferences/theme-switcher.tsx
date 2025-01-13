"use client";

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { IUserTheme } from "@plane/types";
import { setPromiseToast } from "@plane/ui";

// components
import { CustomThemeSelector, ThemeSwitch } from "@/components/core";
// constants
import { I_THEME_OPTION, THEME_OPTIONS } from "@/constants/themes";
// helpers
import { applyTheme, unsetCustomCssVariables } from "@/helpers/theme.helper";
// hooks
import { useUserProfile } from "@/hooks/store";
import { PreferenceOption } from "./config";
import { PreferencesSection } from ".";

export const ThemeSwitcher = observer((props: { option: PreferenceOption }) => {
  // hooks
  const { setTheme } = useTheme();
  const { data: userProfile, updateUserTheme } = useUserProfile();

  // states
  const [currentTheme, setCurrentTheme] = useState<I_THEME_OPTION | null>(null);

  // initialize theme
  useEffect(() => {
    if (!userProfile?.theme?.theme) return;

    const userThemeOption = THEME_OPTIONS.find((t) => t.value === userProfile.theme.theme);

    if (userThemeOption) {
      setCurrentTheme(userThemeOption);
    }
  }, [userProfile?.theme?.theme]);

  // handlers
  const applyThemeChange = useCallback(
    (theme: Partial<IUserTheme>) => {
      const themeValue = theme?.theme || "system";
      setTheme(themeValue);

      if (theme?.theme === "custom" && theme?.palette) {
        const defaultPalette = "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5";
        const palette = theme.palette !== ",,,," ? theme.palette : defaultPalette;
        applyTheme(palette, false);
      } else {
        unsetCustomCssVariables();
      }
    },
    [setTheme]
  );

  const handleThemeChange = useCallback(
    async (themeOption: I_THEME_OPTION) => {
      try {
        applyThemeChange({ theme: themeOption.value });

        const updatePromise = updateUserTheme({ theme: themeOption.value });
        setPromiseToast(updatePromise, {
          loading: "Updating theme...",
          success: {
            title: "Success!",
            message: () => "Theme updated successfully!",
          },
          error: {
            title: "Error!",
            message: () => "Failed to update the theme",
          },
        });
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    },
    [applyThemeChange, updateUserTheme]
  );

  if (!userProfile) return null;

  return (
    <>
      <PreferencesSection
        title={props.option.title}
        description={props.option.description}
        control={<ThemeSwitch value={currentTheme} onChange={handleThemeChange} />}
      />
      {userProfile.theme?.theme === "custom" && <CustomThemeSelector applyThemeChange={applyThemeChange} />}
    </>
  );
});
