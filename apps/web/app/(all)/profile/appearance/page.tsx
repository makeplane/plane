import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import type { IUserTheme } from "@plane/types";
// components
import { applyTheme, applyCustomTheme, unsetCustomCssVariables } from "@plane/utils";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { CustomThemeSelector } from "@/components/core/theme/custom-theme-selector";
import { ThemeSwitch } from "@/components/core/theme/theme-switch";
import { ProfileSettingContentHeader } from "@/components/profile/profile-setting-content-header";
import { ProfileSettingContentWrapper } from "@/components/profile/profile-setting-content-wrapper";
// hooks
import { useUserProfile } from "@/hooks/store/user";

function ProfileAppearancePage() {
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  // states
  const [currentTheme, setCurrentTheme] = useState<I_THEME_OPTION | null>(null);
  // hooks
  const { data: userProfile, updateUserTheme } = useUserProfile();

  useEffect(() => {
    if (userProfile?.theme?.theme) {
      const userThemeOption = THEME_OPTIONS.find((t) => t.value === userProfile?.theme?.theme);
      if (userThemeOption) {
        setCurrentTheme(userThemeOption);
      }
    }
  }, [userProfile?.theme?.theme]);

  // Load custom theme from profile on mount
  useEffect(() => {
    const loadCustomTheme = async () => {
      if (currentTheme?.value === "custom" && userProfile?.theme) {
        try {
          const theme = userProfile.theme;
          if (theme.brandColor && theme.neutralColor && theme.themeMode) {
            await applyCustomTheme(
              theme.brandColor,
              theme.neutralColor,
              theme.themeMode,
              theme.darkModeLightnessOffset
            );
          }
        } catch (error) {
          console.error("Failed to load custom theme from profile:", error);
        }
      }
    };
    loadCustomTheme();
  }, [currentTheme, userProfile?.theme]);

  const handleThemeChange = (themeOption: I_THEME_OPTION) => {
    applyThemeChange({ theme: themeOption.value });

    const updateCurrentUserThemePromise = updateUserTheme({ theme: themeOption.value });
    setPromiseToast(updateCurrentUserThemePromise, {
      loading: "Updating theme...",
      success: {
        title: "Success!",
        message: () => "Theme updated successfully!",
      },
      error: {
        title: "Error!",
        message: () => "Failed to Update the theme",
      },
    });
  };

  const applyThemeChange = async (
    theme: Partial<IUserTheme> & {
      brandColor?: string;
      neutralColor?: string;
      themeMode?: "light" | "dark";
      darkModeLightnessOffset?: number;
    }
  ) => {
    setTheme(theme?.theme || "system");

    if (theme?.theme === "custom") {
      // New 2-color palette system loaded from profile
      if (theme?.brandColor && theme?.neutralColor && theme?.themeMode) {
        await applyCustomTheme(theme.brandColor, theme.neutralColor, theme.themeMode, theme.darkModeLightnessOffset);
      } else if (theme?.palette) {
        // Legacy 5-color system (backward compatibility)
        applyTheme(theme?.palette !== ",,,," ? theme?.palette : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5", false);
      }
    } else {
      // Clear custom theme when switching away
      unsetCustomCssVariables();
    }
  };

  return (
    <>
      <PageHead title="Profile - Appearance" />
      {userProfile ? (
        <ProfileSettingContentWrapper>
          <ProfileSettingContentHeader title={t("appearance")} />
          <div className="grid grid-cols-12 gap-4 py-6 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-16 font-semibold text-primary">{t("theme")}</h4>
              <p className="text-13 text-secondary">{t("select_or_customize_your_interface_color_scheme")}</p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <ThemeSwitch value={currentTheme} onChange={handleThemeChange} />
            </div>
          </div>
          {userProfile?.theme?.theme === "custom" && <CustomThemeSelector applyThemeChange={applyThemeChange} />}
        </ProfileSettingContentWrapper>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <LogoSpinner />
        </div>
      )}
    </>
  );
}

export default observer(ProfileAppearancePage);
