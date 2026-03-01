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

import type { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
import { BaseCalendarRoot } from "@/components/issues/issue-layouts/calendar/base-calendar-root";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
// hooks

type Props = {
  globalViewId: string;
  workspaceSlug: string;
};

export const WorkspaceCalendarLayout: FC<Props> = observer(function WorkspaceCalendarLayout(props: Props) {
  // router
  const { workspaceSlug, globalViewId } = props;
  // hooks
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug || !globalViewId) return null;

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId
    );

  return (
    <BaseCalendarRoot
      viewId={globalViewId}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      QuickActions={AllIssueQuickActions}
    />
  );
});
