import { useEffect, useState } from "react";
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
  const { user: myProfile } = useUserAuth();
  const { theme } = useTheme();
  const [customThemeSelectorOptions, setCustomThemeSelectorOptions] = useState(false);
  const [preLoadedData, setPreLoadedData] = useState<ICustomTheme | null>(null);

  useEffect(() => {
    if (theme === "custom") {
      if (myProfile?.theme.palette) setPreLoadedData(myProfile.theme);
      if (!customThemeSelectorOptions) setCustomThemeSelectorOptions(true);
    }
  }, [myProfile, theme]);

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Preferences" />
        </Breadcrumbs>
      }
    >
      {myProfile ? (
        <div className="px-24 py-8">
          <div className="mb-12 space-y-6">
            <div>
              <h3 className="text-3xl font-semibold">Profile Settings</h3>
              <p className="mt-1 text-brand-secondary">
                This information will be visible to only you.
              </p>
            </div>
            <SettingsNavbar profilePage />
          </div>
          <div className="space-y-8 sm:space-y-12">
            <div className="grid grid-cols-12 gap-4 sm:gap-16">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold text-brand-base">Theme</h4>
                <p className="text-sm text-brand-secondary">
                  Select or customize your interface color scheme.
                </p>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <ThemeSwitch
                  user={myProfile}
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
