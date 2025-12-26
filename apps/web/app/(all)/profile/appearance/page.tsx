import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { applyCustomTheme } from "@plane/utils";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PageHead } from "@/components/core/page-title";
import { CustomThemeSelector } from "@/components/core/theme/custom-theme-selector";
import { ThemeSwitch } from "@/components/core/theme/theme-switch";
import { ProfileSettingContentHeader } from "@/components/profile/profile-setting-content-header";
import { ProfileSettingContentWrapper } from "@/components/profile/profile-setting-content-wrapper";
// hooks
import { useUserProfile } from "@/hooks/store/user";

function ProfileAppearancePage() {
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
    async (themeOption: I_THEME_OPTION) => {
      setTheme(themeOption.value);

      // If switching to custom theme and user has saved custom colors, apply them immediately
      if (
        themeOption.value === "custom" &&
        userProfile?.theme?.primary &&
        userProfile?.theme?.background &&
        userProfile?.theme?.darkPalette !== undefined
      ) {
        applyCustomTheme(
          userProfile.theme.primary,
          userProfile.theme.background,
          userProfile.theme.darkPalette ? "dark" : "light"
        );
      }

      const updateCurrentUserThemePromise = updateUserTheme({ theme: themeOption.value });
      setPromiseToast(updateCurrentUserThemePromise, {
        loading: "Updating theme...",
        success: {
          title: "Theme updated",
          message: () => "Reloading to apply changes...",
        },
        error: {
          title: "Error!",
          message: () => "Failed to update theme. Please try again.",
        },
      });
      // Wait for the promise to resolve, then reload after showing toast
      try {
        await updateCurrentUserThemePromise;
        window.location.reload();
      } catch (error) {
        // Error toast already shown by setPromiseToast
        console.error("Error updating theme:", error);
      }
    },
    [setTheme, updateUserTheme, userProfile]
  );

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
          {userProfile?.theme?.theme === "custom" && <CustomThemeSelector />}
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
