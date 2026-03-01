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

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";

export const ExtendedAppHeader = observer(function ExtendedAppHeader(props: {
  header: ReactNode;
  showToggleButton?: boolean;
}) {
  const { header, showToggleButton = true } = props;
  // router
  const { projectId, workItem } = useParams();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();
  // derived values
  const shouldShowSidebarToggleButton = projectPreferences.navigationMode === "ACCORDION" || (!projectId && !workItem);

  return (
    <>
      {showToggleButton && sidebarCollapsed && shouldShowSidebarToggleButton && <AppSidebarToggleButton />}
      <div className="flex items-center gap-2 divide-x divide-subtle w-full">
        <div className="w-full flex-1">{header}</div>
      </div>
    </>
  );
});
