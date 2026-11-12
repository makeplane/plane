/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectViewLayoutRoot } from "@/components/issues/issue-layouts/roots/project-view-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";

function ProjectViewIssuesPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, viewId } = params;
  // store hooks
  const { fetchViewDetails, getViewById } = useProjectView();
  const { getProjectById } = useProject();
  // derived values
  const projectView = getViewById(viewId);
  const project = getProjectById(projectId);
  const pageTitle = project?.name && projectView?.name ? `${project?.name} - ${projectView?.name}` : undefined;

  const { error } = useSWR(`VIEW_DETAILS_${viewId}`, () => fetchViewDetails(workspaceSlug, projectId, viewId));

  if (error) {
    return (
      <EmptyStateDetailed
        align="center"
        assetKey="view"
        assetClassName="size-40"
        title="View does not exist"
        description="The view you are looking for does not exist or you don't have permission to view it."
        actions={[
          {
            label: "View other views",
            variant: "primary",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/views`),
          },
        ]}
      />
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <ProjectViewLayoutRoot />
    </>
  );
}

export default observer(ProjectViewIssuesPage);
