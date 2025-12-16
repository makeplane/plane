import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import type { I_THEME_OPTION } from "@plane/constants";
import { THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
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
    (themeOption: I_THEME_OPTION) => {
      setTheme(themeOption.value);
      const updateCurrentUserThemePromise = updateUserTheme({ theme: themeOption.value });
      setPromiseToast(updateCurrentUserThemePromise, {
        loading: "Updating theme...",
        success: {
          title: "Success!",
          message: () => "Theme updated successfully.",
        },
        error: {
          title: "Error!",
          message: () => "Failed to update the theme.",
        },
      });
    },
    [updateUserTheme]
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
