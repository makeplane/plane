import { ReactNode, useEffect, useState, FC } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useUser } from "hooks/store";
// helpers
import { applyTheme, unsetCustomCssVariables } from "helpers/theme.helper";

interface IStoreWrapper {
  children: ReactNode;
}

const StoreWrapper: FC<IStoreWrapper> = observer((props) => {
  const { children } = props;
  // states
  const [dom, setDom] = useState<any>();
  // store hooks
  const {
    config: { fetchAppConfig },
    theme: { sidebarCollapsed, toggleSidebar },
  } = useApplication();
  const { currentUser } = useUser();
  // fetching application Config
  useSWR("APP_CONFIG", () => fetchAppConfig(), { revalidateIfStale: false, revalidateOnFocus: false });
  // theme
  const { setTheme } = useTheme();

  /**
   * Sidebar collapsed fetching from local storage
   */
  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("app_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (localValue && sidebarCollapsed === undefined) {
      toggleSidebar(localBoolValue);
    }
  }, [sidebarCollapsed, currentUser, setTheme, toggleSidebar]);

  /**
   * Setting up the theme of the user by fetching it from local storage
   */
  useEffect(() => {
    if (!currentUser) return;
    if (window) {
      setDom(window.document?.querySelector<HTMLElement>("[data-theme='custom']"));
    }
    setTheme(currentUser?.theme?.theme || "system");
    if (currentUser?.theme?.theme === "custom" && dom) {
      applyTheme(currentUser?.theme?.palette, false);
    } else unsetCustomCssVariables();
  }, [currentUser, setTheme, dom]);

  // TODO: set router values

  return <>{children}</>;
});

export default StoreWrapper;
