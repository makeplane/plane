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

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// plane constants
import { ALL_ISSUES, EIssueFilterType } from "@plane/constants";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { SpreadsheetLayoutLoader } from "@/components/ui/loader/layouts/spreadsheet-layout-loader";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// store
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
import { IssueLayoutHOC } from "../../issue-layout-HOC";
import type { TRenderQuickActions } from "../../list/list-view-types";
import { SpreadsheetView } from "../spreadsheet-view";
// constants
import {
  DEFAULT_WORK_ITEM_PERMISSIONS,
  DEFAULT_QUICK_ACTION_PERMISSIONS,
} from "@/components/issues/issue-layouts/constants";

type Props = {
  isDefaultView: boolean;
  workspaceSlug: string;
  globalViewId: string;
  routeFilters: {
    [key: string]: string;
  };
  globalViewsLoading: boolean;
  filtersLoading: boolean;
};

export const WorkspaceSpreadsheetRoot = observer(function WorkspaceSpreadsheetRoot(props: Props) {
  const { workspaceSlug, globalViewId, filtersLoading } = props;

  // Custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Store hooks
  const {
    issuesFilter: { filters, updateFilters },
    issues: { getIssueLoader, getPaginationData, groupedIssueIds },
    permissions,
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue, removeIssue, archiveIssue, fetchIssues, fetchNextIssues } = useIssuesActions(
    EIssuesStoreType.GLOBAL
  );
  const { joinedProjectIds } = useProject();

  // Derived values
  const issueFilters = globalViewId ? filters?.[globalViewId] : undefined;

  useEffect(() => {
    if (filtersLoading || !globalViewId) return;

    fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }, globalViewId);
  }, [fetchIssues, filtersLoading, globalViewId]);

  // Display filters handler
  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;

      updateFilters(
        workspaceSlug,
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { ...updatedDisplayFilter },
        globalViewId
      ).catch((error) => {
        console.error(error);
      });
    },
    [updateFilters, workspaceSlug, globalViewId]
  );

  // Display properties handler
  const handleDisplayPropertiesUpdate = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !globalViewId) return;

      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_PROPERTIES,
        property,
        globalViewId.toString()
      ).catch((error) => {
        console.error(error);
      });
    },
    [updateFilters, workspaceSlug, globalViewId]
  );

  // Quick actions renderer
  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton, placement, portalElement }) => (
      <AllIssueQuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        portalElement={portalElement}
        permissions={
          issue.project_id
            ? {
                canEdit: permissions.getCanEdit(workspaceSlug, issue.project_id, issue.id),
                canDelete: permissions.getCanDelete(workspaceSlug, issue.project_id, issue.id),
                canArchive: permissions.getCanArchive(workspaceSlug, issue.project_id, issue.id),
                canDuplicate: permissions.getCanDuplicate(workspaceSlug, issue.project_id),
              }
            : DEFAULT_QUICK_ACTION_PERMISSIONS
        }
        placements={placement}
      />
    ),
    [permissions, workspaceSlug, removeIssue, updateIssue, archiveIssue]
  );

  // Loading state
  if (getIssueLoader() === "init-loader" || !globalViewId || !groupedIssueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  // Computed values
  const issueIds = groupedIssueIds[ALL_ISSUES];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  // Render spreadsheet
  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.SPREADSHEET}>
      <SpreadsheetView
        workspaceSlug={workspaceSlug}
        projectIds={joinedProjectIds}
        displayProperties={issueFilters?.displayProperties ?? {}}
        displayFilters={issueFilters?.displayFilters ?? {}}
        handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
        handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
        issueIds={Array.isArray(issueIds) ? issueIds : []}
        quickActions={renderQuickActions}
        updateIssue={updateIssue}
        layoutPermissions={{
          canQuickAddWorkItem: false,
          canPerformBulkOps: false,
        }}
        getWorkItemPermissions={(workItem) =>
          workItem.project_id
            ? {
                canEditProperty: (property: TWorkItemProperty) =>
                  permissions.getCanEditProperty(workspaceSlug, workItem.project_id!, workItem.id, property),
                canDragAndDrop: permissions.getCanDragAndDrop(workspaceSlug, workItem.project_id, workItem.id),
              }
            : DEFAULT_WORK_ITEM_PERMISSIONS
        }
        canLoadMoreIssues={!!nextPageResults}
        loadMoreIssues={fetchNextIssues}
        isWorkspaceLevel
      />
    </IssueLayoutHOC>
  );
});
