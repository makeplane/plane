import { ReactNode, useEffect, FC, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
// helpers
import { applyTheme, unsetCustomCssVariables } from "@/helpers/theme.helper";
// hooks
import { useAppRouter, useAppTheme, useUserProfile } from "@/hooks/store";

type TStoreWrapper = {
  children: ReactNode;
};

const StoreWrapper: FC<TStoreWrapper> = observer((props) => {
  const { children } = props;
  // theme
  const {resolvedTheme, setTheme } = useTheme();
  // router
  const router = useRouter();
  // store hooks
  const { setQuery } = useAppRouter();
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { data: userProfile } = useUserProfile();
  // states
  const [dom, setDom] = useState<HTMLElement | null>(null);

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
    setTheme(userProfile?.theme?.theme || resolvedTheme || "system");
    if (!userProfile?.theme?.theme) return;

    if (userProfile?.theme?.theme === "custom" && userProfile?.theme?.palette) {
      applyTheme(
        userProfile?.theme?.palette !== ",,,,"
          ? userProfile?.theme?.palette
          : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
        false,
        dom
      );
    } else unsetCustomCssVariables();
  }, [userProfile, userProfile?.theme, userProfile?.theme?.palette, setTheme, dom]);

  useEffect(() => {
    if (dom) return;

    const observer = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          const customThemeElement = window.document?.querySelector<HTMLElement>("[data-theme='custom']");
          if (customThemeElement) {
            setDom(customThemeElement);
            observer.disconnect();
            break;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [dom]);

  useEffect(() => {
    if (!router.query) return;
    setQuery(router.query);
  }, [router.query, setQuery]);

  return <>{children}</>;
});

export default StoreWrapper;
