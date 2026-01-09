import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
// components
import { CustomThemeSelector } from "@/components/core/theme/custom-theme-selector";
import { ThemeSwitch } from "@/components/core/theme/theme-switch";
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/user";

export const ThemeSwitcher = observer(function ThemeSwitcher(props: {
  option: {
    id: string;
    title: string;
    description: string;
  };
}) {
  // store hooks
  const { data: userProfile, updateUserTheme } = useUserProfile();
  // theme
  const { setTheme } = useTheme();
  // translation
  const { t } = useTranslation();
  // derived values
  const currentTheme = useMemo(() => {
    const userThemeOption = THEME_OPTIONS.find((t) => t.value === userProfile?.theme?.theme);
    return userThemeOption || null;
  }, [userProfile?.theme?.theme]);

  const handleThemeChange = useCallback(
    (themeOption: I_THEME_OPTION) => {
      try {
        setTheme(themeOption.value);
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
    [updateUserTheme]
  );

  if (!userProfile) return null;

  return (
    <>
      <SettingsControlItem
        title={t(props.option.title)}
        description={t(props.option.description)}
        control={<ThemeSwitch value={currentTheme} onChange={handleThemeChange} />}
      />
      {userProfile.theme?.theme === "custom" && <CustomThemeSelector />}
    </>
  );
});
