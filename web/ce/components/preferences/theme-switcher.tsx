"use client";

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { I_THEME_OPTION, THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IUserTheme } from "@plane/types";
import { setPromiseToast } from "@plane/ui";
import { applyTheme, unsetCustomCssVariables } from "@plane/utils";
// components
import { CustomThemeSelector, ThemeSwitch } from "@/components/core";
// helpers
import { PreferencesSection } from "@/components/preferences/section";
// hooks
import { useUserProfile } from "@/hooks/store";

export const ThemeSwitcher = observer(
  (props: {
    option: {
      id: string;
      title: string;
      description: string;
    };
  }) => {
    // hooks
    const { setTheme } = useTheme();
    const { data: userProfile, updateUserTheme } = useUserProfile();

    // states
    const [currentTheme, setCurrentTheme] = useState<I_THEME_OPTION | null>(null);

    const { t } = useTranslation();

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
          title={t(props.option.title)}
          description={t(props.option.description)}
          control={
            <div className="">
              <ThemeSwitch value={currentTheme} onChange={handleThemeChange} />
            </div>
          }
        />
        {userProfile.theme?.theme === "custom" && <CustomThemeSelector applyThemeChange={applyThemeChange} />}
      </>
    );
  }
);
