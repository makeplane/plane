import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import type { IUserTheme } from "@plane/types";
import { applyCustomTheme, clearCustomTheme } from "@plane/utils";
// components
import { CustomThemeSelector } from "@/components/core/theme/custom-theme-selector";
import { ThemeSwitch } from "@/components/core/theme/theme-switch";
// helpers
import { PreferencesSection } from "@/components/preferences/section";
// hooks
import { useUserProfile } from "@/hooks/store/user";

export const ThemeSwitcher = observer(function ThemeSwitcher(props: {
  option: {
    id: string;
    title: string;
    description: string;
  };
}) {
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

  // Load custom theme from profile when theme is custom
  useEffect(() => {
    const loadCustomTheme = () => {
      if (currentTheme?.value === "custom" && userProfile?.theme) {
        try {
          const theme = userProfile.theme;
          if (theme.primary && theme.background && theme.darkPalette !== undefined) {
            applyCustomTheme(theme.primary, theme.background, theme.darkPalette ? "dark" : "light");
          }
        } catch (error) {
          console.error("Failed to load custom theme from profile:", error);
        }
      }
    };
    loadCustomTheme();
  }, [currentTheme, userProfile?.theme]);

  // handlers
  const applyThemeChange = useCallback(
    (theme: Partial<IUserTheme>) => {
      const themeValue = theme?.theme || "system";
      setTheme(themeValue);

      if (theme?.theme === "custom") {
        if (theme?.primary && theme?.background && theme?.darkPalette !== undefined) {
          applyCustomTheme(theme.primary, theme.background, theme.darkPalette ? "dark" : "light");
        }
      } else {
        clearCustomTheme();
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
          <div>
            <ThemeSwitch value={currentTheme} onChange={handleThemeChange} />
          </div>
        }
      />
      {userProfile.theme?.theme === "custom" && <CustomThemeSelector applyThemeChange={applyThemeChange} />}
    </>
  );
});
