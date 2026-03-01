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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { PanelLeft, PanelRight } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";

export const DesktopSidebarToggle = observer(function DesktopSidebarToggle() {
  // router
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // store hooks
  const { sidebarCollapsed, toggleSidebar } = useAppTheme();
  // derived values
  const isSettingsPath = workspaceSlug && pathname.includes(`/${workspaceSlug}/settings`);
  const isNotificationsPath = workspaceSlug && pathname.includes(`/${workspaceSlug}/notifications`);
  const sidebarInaccessiblePaths = isSettingsPath || isNotificationsPath;
  const isSidebarAccessible = workspaceSlug && !sidebarInaccessiblePaths;
  const isSidebarCollapsed = useMemo(() => sidebarCollapsed, [sidebarCollapsed]);

  if (!isSidebarAccessible) return null;
  return (
    <>
      <Tooltip tooltipContent={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} position="bottom">
        <button
          onClick={(e) => {
            toggleSidebar(!isSidebarCollapsed);
            e.currentTarget.blur();
          }}
          className={cn(
            "ml-2 mr-1 size-6 flex items-center justify-center rounded-sm cursor-pointer text-tertiary hover:text-secondary",
            {
              "text-secondary": !isSidebarCollapsed,
            }
          )}
        >
          {isSidebarCollapsed ? (
            <PanelRight className="size-4" strokeWidth={2.5} />
          ) : (
            <PanelLeft className="size-4" strokeWidth={2.5} />
          )}
        </button>
      </Tooltip>
    </>
  );
});
