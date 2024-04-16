"use client";

import { FC, ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { SWRConfig } from "swr";
// hooks
import { useTheme, useUser } from "@/hooks";
// ui
import { Toast } from "@plane/ui";
// constants
import { SWR_CONFIG } from "constants/swr-config";
// helpers
import { resolveGeneralTheme } from "helpers/common.helper";

interface IAppWrapper {
  children: ReactNode;
}

export const AppWrapper: FC<IAppWrapper> = observer(({ children }) => {
  // store hooks
  const { theme, isSidebarCollapsed, toggleSidebar } = useTheme();
  const { currentUser } = useUser();
  const {} = useTheme();

  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("god_mode_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (isSidebarCollapsed === undefined && localBoolValue != isSidebarCollapsed) toggleSidebar(localBoolValue);
  }, [isSidebarCollapsed, currentUser, toggleSidebar]);

  return (
    <>
      <Toast theme={resolveGeneralTheme(theme)} />
      <SWRConfig value={SWR_CONFIG}>{children}</SWRConfig>
    </>
  );
});
