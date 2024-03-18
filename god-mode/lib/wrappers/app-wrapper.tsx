"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { SWRConfig } from "swr";
// hooks
import useAppTheme from "hooks/use-theme";
import useUser from "hooks/use-user";
import { useTheme } from "next-themes";
// ui
import { Toast } from "@plane/ui";
// constants
import { SWR_CONFIG } from "constants/swr-config";
// helpers
import { resolveGeneralTheme } from "helpers/common.helper";

interface IAppWrapper {
  children: ReactNode;
}

const AppWrapper: FC<IAppWrapper> = observer(({ children }) => {
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  const { currentUser } = useUser();
  // themes
  const { resolvedTheme } = useTheme();

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
    <>
      <Toast theme={resolveGeneralTheme(resolvedTheme)} />
      <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>
    </>
  );
});

export default AppWrapper;
