"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { I_THEME_OPTION, THEME_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IUserTheme } from "@plane/types";
import { setPromiseToast } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { CustomThemeSelector, ThemeSwitch, PageHead } from "@/components/core";
import { LanguageTimezone, ProfileSettingContentHeader } from "@/components/profile";
// constants
// helpers
import { applyTheme, unsetCustomCssVariables } from "@/helpers/theme.helper";
// hooks
import { useUserProfile } from "@/hooks/store";
const ProfileAppearancePage = observer(() => {
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

  const applyThemeChange = (theme: Partial<IUserTheme>) => {
    setTheme(theme?.theme || "system");

    if (theme?.theme === "custom" && theme?.palette) {
      applyTheme(theme?.palette !== ",,,," ? theme?.palette : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5", false);
    } else unsetCustomCssVariables();
  };

  return (
    <>
      <PageHead title="Profile - Preferences" />
      {userProfile ? (
        <>
          <div className="flex flex-col gap-4 md:min-w-[700px]">
            <div>
              <ProfileSettingContentHeader title={t("preferences")} />
              <div className="flex gap-4 py-6 sm:gap-16 w-full justify-between">
                <div className="col-span-12 sm:col-span-6">
                  <h4 className="text-base font-medium text-custom-text-100">{t("theme")}</h4>
                  <p className="text-sm text-custom-text-200">{t("select_or_customize_your_interface_color_scheme")}</p>
                </div>
                <div className="col-span-12 sm:col-span-6 my-auto">
                  <ThemeSwitch value={currentTheme} onChange={handleThemeChange} />
                  {userProfile?.theme?.theme === "custom" && (
                    <CustomThemeSelector applyThemeChange={applyThemeChange} />
                  )}
                </div>
              </div>
            </div>
            <div>
              <ProfileSettingContentHeader title={t("language_and_time")} />
              <LanguageTimezone />
            </div>
          </div>
        </>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <LogoSpinner />
        </div>
      )}
    </>
  );
});

export default ProfileAppearancePage;
