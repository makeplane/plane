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
// components
import { BaseKanBanRoot } from "@/components/issues/issue-layouts/board/base-kanban-root";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
// hooks
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// hooks

type Props = {
  globalViewId: string;
  workspaceSlug: string;
};

export const WorkspaceViewBoardLayout: FC<Props> = observer(function WorkspaceViewBoardLayout(props: Props) {
  // props
  const { globalViewId, workspaceSlug } = props;
  // hooks
  const { allowPermissions } = useUserPermissions();

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId
    );

  return (
    <BaseKanBanRoot
      QuickActions={AllIssueQuickActions}
      viewId={globalViewId}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});
