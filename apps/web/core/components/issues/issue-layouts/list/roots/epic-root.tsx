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
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserProjectRoles } from "@plane/types";
// components
import { BaseListRoot } from "@/components/issues/issue-layouts/list/base-list-root";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane-web
import { ProjectEpicQuickActions } from "@/components/epics/quick-actions/epic-quick-action";

export const EpicListLayout = observer(function EpicListLayout() {
  const { workspaceSlug, projectId } = useParams();
  const { allowPermissions } = useUserPermissions();

  if (!workspaceSlug || !projectId) return null;

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug.toString(),
      projectId
    );

  return (
    <BaseListRoot
      QuickActions={ProjectEpicQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      isEpic
    />
  );
});
