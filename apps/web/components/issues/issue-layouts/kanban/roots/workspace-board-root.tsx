/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { WORKSPACE_BOARD_VIEW_ID, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EmptyStateDetailed } from "@plane/blocks/empty-state";
import { EIssuesStoreType } from "@plane/types";
// components
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { KanbanLayoutLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// local imports
import { BaseKanBanRoot } from "../base-kanban-root";

export const WorkspaceBoardRoot = observer(function WorkspaceBoardRoot() {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    issues: { clear },
    issuesFilter: { fetchFilters, getIssueFilters },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { loader, joinedProjectIds, fetchProjects } = useProject();
  const { allowPermissions } = useUserPermissions();
  // state
  const [ready, setReady] = useState(false);
  // derived values
  const workspaceSlugPath = workspaceSlug?.toString();
  // custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Fetch board filters once; the kanban root fetches issues itself once filters are ready.
  useEffect(() => {
    if (!workspaceSlugPath) return;
    clear();
    void fetchFilters(workspaceSlugPath, WORKSPACE_BOARD_VIEW_ID).then(() => setReady(true));
  }, [workspaceSlugPath, clear, fetchFilters]);

  // Projects are normally preloaded by the workspace wrapper; fetch once if they are not.
  useEffect(() => {
    if (workspaceSlugPath && loader === "init-loader") void fetchProjects(workspaceSlugPath);
  }, [workspaceSlugPath, loader, fetchProjects]);

  const filters = getIssueFilters(WORKSPACE_BOARD_VIEW_ID);

  if (!ready || !filters?.displayFilters?.group_by) return <KanbanLayoutLoader />;

  if (loader === "loaded" && joinedProjectIds.length === 0) {
    return (
      <EmptyStateDetailed
        assetKey="project"
        title="No projects yet"
        description="Join or create a project to start seeing its work items on this board."
        actions={[
          {
            label: "Go to projects",
            onClick: () => router.push(`/${workspaceSlugPath}/projects/`),
            variant: "primary",
          },
        ]}
      />
    );
  }

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.GLOBAL}>
      <BaseKanBanRoot
        QuickActions={AllIssueQuickActions}
        viewId={WORKSPACE_BOARD_VIEW_ID}
        workspaceLevelEditing
        skipEmptyState
        hideGroupHeaderAddButton
        jiraStyleBands
        canEditPropertiesBasedOnProject={(projectId: string) =>
          allowPermissions(
            [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
            EUserPermissionsLevel.PROJECT,
            workspaceSlugPath,
            projectId
          )
        }
      />
      <IssuePeekOverview />
    </IssuesStoreContext.Provider>
  );
});
