"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { IUserTheme } from "@plane/types";
import { setPromiseToast } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { CustomThemeSelector, ThemeSwitch, PageHead } from "@/components/core";
import { ProfileSettingContentHeader, ProfileSettingContentWrapper } from "@/components/profile";
// constants
import { I_THEME_OPTION, THEME_OPTIONS } from "@/constants/themes";
// helpers
import { applyTheme, unsetCustomCssVariables } from "@/helpers/theme.helper";
// hooks
import { useUserProfile } from "@/hooks/store";

const ProfileAppearancePage = observer(() => {
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

    const customThemeElement = window.document?.querySelector<HTMLElement>("[data-theme='custom']");
    if (theme?.theme === "custom" && theme?.palette && customThemeElement) {
      applyTheme(
        theme?.palette !== ",,,," ? theme?.palette : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
        false,
        customThemeElement
      );
    } else unsetCustomCssVariables();
  };

  return (
    <>
      <PageHead title="Profile - Appearance" />
      {userProfile ? (
        <ProfileSettingContentWrapper>
          <ProfileSettingContentHeader title="Appearance" />
          <div className="grid grid-cols-12 gap-4 py-6 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold text-custom-text-100">Theme</h4>
              <p className="text-sm text-custom-text-200">Select or customize your interface color scheme.</p>
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
});

export default ProfileAppearancePage;
