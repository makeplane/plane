import type { ReactNode } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import type { TLanguage } from "@plane/i18n";
import { useTranslation } from "@plane/i18n";
// helpers
import { applyCustomTheme, clearCustomTheme } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useRouterParams } from "@/hooks/store/use-router-params";
import { useUserProfile } from "@/hooks/store/user";

type TStoreWrapper = {
  children: ReactNode;
};

function StoreWrapper(props: TStoreWrapper) {
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
   * Setting up the theme of the user by fetching it from profile
   */
  useEffect(() => {
    if (!userProfile?.theme?.theme) return;
    const currentTheme = userProfile?.theme?.theme || "system";
    const theme = userProfile?.theme;

    if (currentTheme) {
      setTheme(currentTheme);
      if (currentTheme === "custom") {
        // New 2-color palette system
        if (theme.primary && theme.background && theme.darkPalette !== undefined) {
          applyCustomTheme(theme.primary, theme.background, theme.darkPalette ? "dark" : "light");
        }
      } else {
        clearCustomTheme();
      }
    }
  }, [userProfile?.theme, setTheme]);

  useEffect(() => {
    if (!userProfile?.language) return;
    changeLanguage(userProfile?.language as TLanguage);
  }, [userProfile?.language, changeLanguage]);

  useEffect(() => {
    if (!params) return;
    setQuery(params);
  }, [params, setQuery]);

  return <>{children}</>;
}

export default observer(StoreWrapper);
