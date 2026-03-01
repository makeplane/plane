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

import { observer } from "mobx-react";
// hooks
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { ProjectsListWithGroupingHeader } from "./with-grouping/root";
import { ProjectsListWithoutGroupingHeader } from "./without-grouping/root";

type TProjectsListHeaderProps = {
  workspaceSlug: string;
  isArchived?: boolean;
};

export const ProjectsListHeader = observer(function ProjectsListHeader(props: TProjectsListHeaderProps) {
  const { workspaceSlug, isArchived = false } = props;
  // hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const isProjectGroupingFlagEnabled = useFlag(workspaceSlug, "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) && isProjectGroupingFlagEnabled;

  if (isProjectGroupingEnabled) {
    return <ProjectsListWithGroupingHeader workspaceSlug={workspaceSlug} isArchived={isArchived} />;
  }

  return <ProjectsListWithoutGroupingHeader workspaceSlug={workspaceSlug} isArchived={isArchived} />;
});
