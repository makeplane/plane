/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane helpers
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { PreferencesIcon } from "@plane/propel/icons";
import { ScrollArea } from "@plane/propel/scrollarea";
// components
import { CustomizeNavigationDialog } from "@/components/navigation/customize-navigation-dialog";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import useSize from "@/hooks/use-window-size";
// plane web components
import { WorkspaceEditionBadge } from "@/components/workspace/edition-badge";
import { AppSidebarToggleButton } from "./sidebar-toggle-button";
import { IconButton } from "@plane/propel/icon-button";
import { SidebarTipSection } from "../workspace/sidebar/sidebar-tip-section";
import { SidebarTrySection } from "../workspace/sidebar/sidebar-try-section";

type TSidebarWrapperProps = {
  title: string;
  children: React.ReactNode;
  quickActions?: React.ReactNode;
};

export const SidebarWrapper = observer(function SidebarWrapper(props: TSidebarWrapperProps) {
  const { title, children, quickActions } = props;
  // state
  const [isCustomizeNavDialogOpen, setIsCustomizeNavDialogOpen] = useState(false);
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const windowSize = useSize();
  const { allowPermissions } = useUserPermissions();

  // refs
  const ref = useRef<HTMLDivElement>(null);

  const isWorkspaceAdmin = useMemo(
    () => allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE),
    [allowPermissions]
  );

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false && window.innerWidth < 768) {
      toggleSidebar();
    }
  });

  useEffect(() => {
    if (windowSize[0] < 768 && !sidebarCollapsed) toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  return (
    <>
      <CustomizeNavigationDialog isOpen={isCustomizeNavDialogOpen} onClose={() => setIsCustomizeNavDialogOpen(false)} />
      <div ref={ref} className="relative animate-fade-in flex flex-col h-full w-full">
        <div className="flex flex-col gap-3 px-3">
          {/* Workspace switcher and settings */}

          <div className="flex items-center justify-between gap-2 px-2">
            <span className="text-16 text-primary font-medium pt-1">{title}</span>

            <div className="flex items-center gap-2">
              {title === "Projects" && (
                <IconButton
                  size="base"
                  variant="ghost"
                  icon={PreferencesIcon}
                  onClick={() => setIsCustomizeNavDialogOpen(true)}
                  data-tour="navigation-step-3"
                />
              )}
              <AppSidebarToggleButton />
            </div>
          </div>
          {/* Quick actions */}
          {quickActions}
        </div>

        <ScrollArea
          orientation="vertical"
          scrollType="hover"
          size="sm"
          rootClassName="size-full overflow-x-hidden overflow-y-auto"
          viewportClassName="flex flex-col gap-3 overflow-x-hidden h-full w-full overflow-y-auto px-3 pt-3 pb-0.5"
        >
          {children}
          {isWorkspaceAdmin && (
            <div className="flex flex-col gap-2">
              <SidebarTrySection />
              <SidebarTipSection />
            </div>
          )}
        </ScrollArea>
        {/* Help Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-3 border-t border-subtle bg-surface-1 h-12">
            <WorkspaceEditionBadge />
          </div>
        </div>
      </div>
    </>
  );
});
