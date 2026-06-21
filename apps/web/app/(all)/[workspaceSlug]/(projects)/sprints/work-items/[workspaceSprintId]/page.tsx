/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { DEFAULT_GLOBAL_VIEWS_LIST } from "@plane/constants";
import { PageHead } from "@/components/core/page-title";
import { AllIssueLayoutRoot } from "@/components/issues/issue-layouts/roots/all-issue-layout-root";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";
import type { Route } from "./+types/page";

function WorkspaceSprintWorkItemsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, workspaceSprintId } = params;
  const [isLoading, setIsLoading] = useState(false);
  const { fetchArchivedWorkspaceSprints, fetchWorkspaceSprints, getSprintById } = useWorkspaceSprint();

  const sprint = getSprintById(workspaceSprintId);
  const defaultView = DEFAULT_GLOBAL_VIEWS_LIST.find((view) => view.key === "all-issues");

  useEffect(() => {
    fetchWorkspaceSprints(workspaceSlug);
    fetchArchivedWorkspaceSprints(workspaceSlug);
  }, [fetchArchivedWorkspaceSprints, fetchWorkspaceSprints, workspaceSlug]);

  return (
    <>
      <PageHead title={sprint?.name ? `${sprint.name} - Sprint` : "Sprint"} />
      <AllIssueLayoutRoot
        globalViewIdOverride="all-issues"
        isDefaultView={!!defaultView}
        isLoading={isLoading}
        routeFiltersOverride={{ global_sprint_id: workspaceSprintId }}
        toggleLoading={setIsLoading}
      />
    </>
  );
}

export default observer(WorkspaceSprintWorkItemsPage);
