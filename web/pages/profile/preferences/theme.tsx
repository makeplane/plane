import { useEffect, useState, ReactElement } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// ui
import { setPromiseToast } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { CustomThemeSelector, ThemeSwitch, PageHead } from "@/components/core";
// constants
import { I_THEME_OPTION, THEME_OPTIONS } from "@/constants/themes";
// hooks
import { useUserProfile } from "@/hooks/store";
// layouts
import { ProfilePreferenceSettingsLayout } from "@/layouts/settings-layout/profile/preferences";
// type
import { NextPageWithLayout } from "@/lib/types";

const ProfilePreferencesThemePage: NextPageWithLayout = observer(() => {
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
    setTheme(themeOption.value);
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

  return (
    <>
      <PageHead title="Profile - Theme Prefrence" />
      {userProfile ? (
        <div className="mx-auto mt-10 h-full w-full overflow-y-auto md:px-6 px-4 pb-8 md:mt-14 lg:px-20 vertical-scrollbar scrollbar-md">
          <div className="flex items-center border-b border-custom-border-100 pb-3.5">
            <h3 className="text-xl font-medium">Preferences</h3>
          </div>
          <div className="grid grid-cols-12 gap-4 py-6 sm:gap-16">
            <div className="col-span-12 sm:col-span-6">
              <h4 className="text-lg font-semibold text-custom-text-100">Theme</h4>
              <p className="text-sm text-custom-text-200">Select or customize your interface color scheme.</p>
            </div>
            <div className="col-span-12 sm:col-span-6">
              <ThemeSwitch value={currentTheme} onChange={handleThemeChange} />
            </div>
          </div>
          {userProfile?.theme?.theme === "custom" && <CustomThemeSelector />}
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <LogoSpinner />
        </div>
      )}
    </>
  );
});

ProfilePreferencesThemePage.getLayout = function getLayout(page: ReactElement) {
  return <ProfilePreferenceSettingsLayout>{page}</ProfilePreferenceSettingsLayout>;
};

export default ProfilePreferencesThemePage;
