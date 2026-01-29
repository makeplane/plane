/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useInstance, useTheme, useUser } from "@/hooks/store";

export const UserProvider = observer(function UserProvider({ children }: React.PropsWithChildren) {
  // hooks
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  const { currentUser, fetchCurrentUser } = useUser();
  const { fetchInstanceAdmins } = useInstance();

  useSWR("CURRENT_USER", () => fetchCurrentUser(), {
    shouldRetryOnError: false,
  });

  useSWR("INSTANCE_ADMINS", () => fetchInstanceAdmins());

  useEffect(() => {
    const localValue = localStorage && localStorage.getItem("god_mode_sidebar_collapsed");
    const localBoolValue = localValue ? (localValue === "true" ? true : false) : false;
    if (isSidebarCollapsed === undefined && localBoolValue != isSidebarCollapsed) toggleSidebar(localBoolValue);
  }, [isSidebarCollapsed, currentUser, toggleSidebar]);

  return <>{children}</>;
});
