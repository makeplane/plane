import { ReactNode, useEffect, FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslation, TLanguage } from "@plane/i18n";
// helpers
import { applyTheme, unsetCustomCssVariables } from "@plane/utils";
// hooks
import { useRouterParams, useAppTheme, useUserProfile } from "@/hooks/store";

type TStoreWrapper = {
  children: ReactNode;
};

const StoreWrapper: FC<TStoreWrapper> = observer((props) => {
  const { children } = props;
  // theme
  const { setTheme } = useTheme();
  // router
  const params = useParams();
  // store hooks
  const { setQuery } = useRouterParams();
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { data: userProfile } = useUserProfile();
  const { changeLanguage } = useTranslation();

  /**
   * Sidebar collapsed fetching from local storage
   */
  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("app_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (localValue && sidebarCollapsed === undefined) toggleSidebar(localBoolValue);
  }, [sidebarCollapsed, setTheme, toggleSidebar]);

  /**
   * Setting up the theme of the user by fetching it from local storage
   */
  useEffect(() => {
    if (!userProfile?.theme?.theme) return;
    const currentTheme = userProfile?.theme?.theme || "system";
    const currentThemePalette = userProfile?.theme?.palette;
    if (currentTheme) {
      setTheme(currentTheme);
      if (currentTheme === "custom" && currentThemePalette) {
        applyTheme(
          currentThemePalette !== ",,,," ? currentThemePalette : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
          false
        );
      } else unsetCustomCssVariables();
    }
  }, [userProfile?.theme?.theme, userProfile?.theme?.palette, setTheme]);

  useEffect(() => {
    if (!userProfile?.language) return;
    changeLanguage(userProfile?.language as TLanguage);
  }, [userProfile?.language, changeLanguage]);

  useEffect(() => {
    if (!params) return;
    setQuery(params);
  }, [params, setQuery]);

  return <>{children}</>;
});

export default StoreWrapper;
