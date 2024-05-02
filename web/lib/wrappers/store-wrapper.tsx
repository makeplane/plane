import { ReactNode, useEffect, FC, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
// helpers
import { applyTheme, unsetCustomCssVariables } from "@/helpers/theme.helper";
// hooks
import { useAppRouter, useAppTheme, useUser } from "@/hooks/store";

type TStoreWrapper = {
  children: ReactNode;
};

const StoreWrapper: FC<TStoreWrapper> = observer((props) => {
  const { children } = props;
  // theme
  const { setTheme } = useTheme();
  // router
  const router = useRouter();
  // store hooks
  const { setQuery } = useAppRouter();
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const {
    userProfile: { data: userProfile },
  } = useUser();
  // states
  const [dom, setDom] = useState<undefined | HTMLElement>();

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
    if (!userProfile) return;
    if (window) setDom(window.document?.querySelector<HTMLElement>("[data-theme='custom']") || undefined);

    setTheme(userProfile?.theme?.theme || "system");
    if (userProfile?.theme?.theme === "custom" && userProfile?.theme?.palette && dom)
      applyTheme(userProfile?.theme?.palette, false);
    else unsetCustomCssVariables();
  }, [userProfile, setTheme, dom]);

  useEffect(() => {
    if (!router.query) return;
    setQuery(router.query);
  }, [router.query, setQuery]);

  return <>{children}</>;
});

export default StoreWrapper;
