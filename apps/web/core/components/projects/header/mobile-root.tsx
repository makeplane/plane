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
import { ProjectsListWithGroupingMobileHeader } from "./with-grouping/mobile-root";
import { ProjectsListWithoutGroupingMobileHeader } from "./without-grouping/mobile-root";

type TProjectsListMobileHeaderProps = {
  workspaceSlug: string;
  isArchived?: boolean;
};

export const ProjectsListMobileHeader = observer(function ProjectsListMobileHeader(
  props: TProjectsListMobileHeaderProps
) {
  const { workspaceSlug, isArchived = false } = props;
  // hooks
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const isProjectGroupingFlagEnabled = useFlag(workspaceSlug, "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) && isProjectGroupingFlagEnabled;

  if (isProjectGroupingEnabled) {
    return <ProjectsListWithGroupingMobileHeader workspaceSlug={workspaceSlug} isArchived={isArchived} />;
  }

  return <ProjectsListWithoutGroupingMobileHeader workspaceSlug={workspaceSlug} />;
});
