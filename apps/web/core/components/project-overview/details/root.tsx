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
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { LayoutRoot } from "@/components/common/layout";
// local imports
import { ProjectOverviewMainContentRoot } from "./main/root";
import { ProjectOverviewSidebarRoot } from "./sidebar/root";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewRoot = observer(function ProjectOverviewRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();

  // derived values
  const isEditable = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <LayoutRoot key={projectId}>
      <ProjectOverviewMainContentRoot workspaceSlug={workspaceSlug} projectId={projectId} disabled={!isEditable} />
      <ProjectOverviewSidebarRoot workspaceSlug={workspaceSlug} projectId={projectId} />
    </LayoutRoot>
  );
});
