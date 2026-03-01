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
import useSWR from "swr";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import { ProjectsListWithGrouping } from "./with-grouping/root";
import { ProjectsListWithoutGrouping } from "./without-grouping/root";

type TProjectsListRootProps = {
  workspaceSlug: string;
  isArchived?: boolean;
};

export const ProjectsListRoot = observer(function ProjectsListRoot(props: TProjectsListRootProps) {
  const { workspaceSlug, isArchived = false } = props;
  // store
  const { currentWorkspace } = useWorkspace();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { fetchProjects } = useProject();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Projects` : undefined;
  const isProjectGroupingFlagEnabled = useFlag(workspaceSlug, "PROJECT_GROUPING");
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) && isProjectGroupingFlagEnabled;

  // fetching workspace projects
  useSWR(
    currentWorkspace ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    currentWorkspace ? () => fetchProjects(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (isProjectGroupingEnabled) {
    return (
      <>
        <PageHead title={pageTitle} />
        <ProjectsListWithGrouping workspaceSlug={workspaceSlug} isArchived={isArchived} />
      </>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectsListWithoutGrouping workspaceSlug={workspaceSlug} isArchived={isArchived} />
    </>
  );
});
