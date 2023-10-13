import { useEffect, useState } from "react";
// hooks
import useUserAuth from "hooks/use-user-auth";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import { CustomThemeSelector, ThemeSwitch } from "components/core";
// ui
import { Spinner } from "@plane/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { ICustomTheme } from "types";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { SettingsSidebar } from "components/project";

const ProfilePreferences = observer(() => {
  const { user: myProfile } = useUserAuth();

  const store: any = useMobxStore();

  // console.log("store", store?.theme?.theme);
  // console.log("theme", theme);

  const [customThemeSelectorOptions, setCustomThemeSelectorOptions] = useState(false);

  const [preLoadedData, setPreLoadedData] = useState<ICustomTheme | null>(null);

  useEffect(() => {
    if (store?.user && store?.theme?.theme === "custom") {
      const currentTheme = store?.user?.currentUserSettings?.theme;
      if (currentTheme.palette)
        setPreLoadedData({
          background: currentTheme.background !== "" ? currentTheme.background : "#0d101b",
          text: currentTheme.text !== "" ? currentTheme.text : "#c5c5c5",
          primary: currentTheme.primary !== "" ? currentTheme.primary : "#3f76ff",
          sidebarBackground: currentTheme.sidebarBackground !== "" ? currentTheme.sidebarBackground : "#0d101b",
          sidebarText: currentTheme.sidebarText !== "" ? currentTheme.sidebarText : "#c5c5c5",
          darkPalette: false,
          palette: currentTheme.palette !== ",,,," ? currentTheme.palette : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
          theme: "custom",
        });
      setCustomThemeSelectorOptions(() => true);
    }
  }, [store, store?.theme?.theme]);

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Profile Preferences" />
        </Breadcrumbs>
      }
    >
      {myProfile ? (
        <div className="flex flex-row gap-2 h-full">
          <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
            <SettingsSidebar />
          </div>

          <div className="pr-9 py-8 w-full overflow-y-auto">
            <div className="flex items-center py-3.5 border-b border-custom-border-200">
              <h3 className="text-xl font-medium">Preferences</h3>
            </div>
            <div className="grid grid-cols-12 gap-4 sm:gap-16 py-6">
              <div className="col-span-12 sm:col-span-6">
                <h4 className="text-lg font-semibold text-custom-text-100">Theme</h4>
                <p className="text-sm text-custom-text-200">Select or customize your interface color scheme.</p>
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
});

export default ProfilePreferences;
