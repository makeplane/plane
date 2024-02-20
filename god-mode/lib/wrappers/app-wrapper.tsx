"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { SWRConfig } from "swr";
// lib
import { ThemeProvider } from "lib/theme-provider";
import { ToastContextProvider } from "lib/toast-provider";
// hooks
import useAppTheme from "hooks/use-theme";
import useUser from "hooks/use-user";
// constants
import { SWR_CONFIG } from "constants/swr-config";

interface IAppWrapper {
  children: ReactNode;
}

const AppWrapper: FC<IAppWrapper> = observer(({ children }) => {
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { currentUser } = useUser();

  /**
   * Sidebar collapsed fetching from local storage
   */
  useEffect(() => {
    const localValue =
      localStorage && localStorage.getItem("god_mode_sidebar_collapsed");
    const localBoolValue = localValue
      ? localValue === "true"
        ? true
        : false
      : false;

    if (localValue && sidebarCollapsed === undefined)
      toggleSidebar(localBoolValue);
  }, [sidebarCollapsed, currentUser, toggleSidebar]);

  return (
    <ThemeProvider
      themes={["light", "dark"]}
      defaultTheme="system"
      enableSystem
    >
      <ToastContextProvider>
        <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>
      </ToastContextProvider>
    </ThemeProvider>
  );
});

export default AppWrapper;
