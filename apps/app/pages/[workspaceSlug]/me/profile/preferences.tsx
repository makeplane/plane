import { useEffect, useState } from "react";

// next-themes
import { useTheme } from "next-themes";
// hooks
import useUserAuth from "hooks/use-user-auth";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import SettingsNavbar from "layouts/settings-navbar";
// components
import { CustomThemeSelector, ThemeSwitch } from "components/core";
// ui
import { Spinner } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { ICustomTheme } from "types";

const ProfilePreferences = () => {
  const [customThemeSelectorOptions, setCustomThemeSelectorOptions] = useState(false);
  const [preLoadedData, setPreLoadedData] = useState<ICustomTheme | null>(null);

  const { theme } = useTheme();

  const { user: myProfile } = useUserAuth();

  useEffect(() => {
    if (theme === "custom") {
      if (myProfile?.theme.palette)
        setPreLoadedData({
          background: myProfile.theme.background !== "" ? myProfile.theme.background : "#0d101b",
          text: myProfile.theme.text !== "" ? myProfile.theme.text : "#c5c5c5",
          primary: myProfile.theme.primary !== "" ? myProfile.theme.primary : "#3f76ff",
          sidebarBackground:
            myProfile.theme.sidebarBackground !== ""
              ? myProfile.theme.sidebarBackground
              : "#0d101b",
          sidebarText: myProfile.theme.sidebarText !== "" ? myProfile.theme.sidebarText : "#c5c5c5",
          darkPalette: false,
          palette:
            myProfile.theme.palette !== ",,,,"
              ? myProfile.theme.palette
              : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
          theme: "custom",
        });
      if (!customThemeSelectorOptions) setCustomThemeSelectorOptions(true);
    }
  }, [myProfile, theme, customThemeSelectorOptions]);

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Preferences" />
        </Breadcrumbs>
      }
    >
      {myProfile ? (
        <div className="p-8">
          <div className="mb-8 space-y-6">
            <div>
              <h3 className="text-3xl font-semibold">Profile Settings</h3>
              <p className="mt-1 text-custom-text-200">
                This information will be visible to only you.
              </p>
            </div>
            <SettingsNavbar profilePage />
          </div>
          <div className="space-y-8 sm:space-y-12">
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold text-custom-text-100">Theme</h4>
                <p className="text-sm text-custom-text-200">
                  Select or customize your interface color scheme.
                </p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <ThemeSwitch
                  setPreLoadedData={setPreLoadedData}
                  customThemeSelectorOptions={customThemeSelectorOptions}
                  setCustomThemeSelectorOptions={setCustomThemeSelectorOptions}
                />
              </div>
            </div>
            {customThemeSelectorOptions && <CustomThemeSelector preLoadedData={preLoadedData} />}
          </div>
        </div>
      ) : (
        <div className="grid h-full w-full place-items-center px-4 sm:px-0">
          <Spinner />
        </div>
      )}
    </WorkspaceAuthorizationLayout>
  );
};

export default ProfilePreferences;
