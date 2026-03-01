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

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { BaseKanBanRoot } from "@/components/issues/issue-layouts/board/base-kanban-root";
import { ProjectIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
// hooks
import { useUserPermissions } from "@/hooks/store/user";

export const TeamspaceViewBoardLayout = observer(function TeamspaceViewBoardLayout() {
  // router
  const { workspaceSlug, viewId } = useParams();
  // hooks
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug || !viewId) return null;

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId
    );

  return (
    <BaseKanBanRoot
      QuickActions={ProjectIssueQuickActions}
      viewId={viewId.toString()}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});
