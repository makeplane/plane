"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { EUserPermissions, EUserPermissionsLevel } from "ee/constants/user-permissions";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { GroupByColumnTypes, TGroupedIssues, TIssue } from "@plane/types";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues, useUserPermissions } from "@/hooks/store";
import { useGroupIssuesDragNDrop } from "@/hooks/use-group-dragndrop";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import useLocalStorage from "@/hooks/use-local-storage";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { IssueBlockRoot, IssuePeekOverview } from "../issues";
import { TRenderQuickActions } from "../issues/issue-layouts/list/list-view-types";
import Banner from "./Banner";
import { WorkspaceDraftIssueQuickActions } from "./workspace-draft-issue-modal";

const Root = observer(() => {
  const storeType = useIssueStoreType() as EIssuesStoreType.WORKSPACE_DRAFT;

  const { workspaceSlug } = useParams();
  const {
    issues,
    issuesFilter,
  } = useIssues(storeType);
  const { issueMap } = useIssues();

  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);

  const {
    fetchIssues,
    fetchNextIssues,
    quickAddIssue,
    updateIssue,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
    createIssue,
  } = useIssuesActions(storeType);

  const { allowPermissions } = useUserPermissions();
  const displayProperties = {
    assignee: true,
    start_date: true,
    due_date: true,
    labels: true,
    priority: true,
    state: true,
    sub_issue_count: true,
    attachment_count: true,
    link: true,
    estimate: true,
    key: true,
    created_on: true,
    updated_on: true,
    modules: true,
    cycle: true,
    issue_type: true,
  };

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  // const displayProperties = issuesFilter?.issueFilters?.displayProperties;
  const orderBy = displayFilters?.order_by || undefined;

  const group_by = (displayFilters?.group_by || null) as GroupByColumnTypes | null;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;

  useEffect(() => {
    fetchIssues(
      "init-loader",
      {
        canGroup: false,
        perPageCount: 100,
      },
      workspaceSlug.toString()
    );
  }, [fetchIssues, workspaceSlug]);

  const groupedIssueIds = issues?.groupedIssueIds as TGroupedIssues | undefined;

  // const isEditingAllowed = allowPermissions(
  //   [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  //   EUserPermissionsLevel.PROJECT
  // );
  const isEditingAllowed = true;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

  const canEditProperties = (projectId: string | undefined) => true;

  const handleOnDrop = useGroupIssuesDragNDrop(storeType, orderBy, group_by);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef }) => (
      <WorkspaceDraftIssueQuickActions
        parentRef={parentRef}
        issue={issue}
        handleDelete={async () => removeIssue(workspaceSlug.toString(), issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
        readOnly={!isEditingAllowed}
      />
    ),
    [removeIssue, isEditingAllowed, updateIssue, workspaceSlug]
  );

  const loadMoreIssues = useCallback(
    (groupId?: string) => {
      fetchNextIssues(groupId);
    },
    [fetchNextIssues]
  );

  const { storedValue: isBannerHidden, setValue: hideBanner } = useLocalStorage<boolean>("isBannerHidden", false);

  useEffect(() => {
    if (!isBannerHidden) {
      hideBanner(true);
    }
  }, [isBannerHidden, hideBanner]);
  return (
    <>
      {!isBannerHidden && <Banner />}
      <div className="relative h-full w-full">
        {issueMap &&
          Object.keys(issueMap).map((issueId: string, index: number) => (
            <IssueBlockRoot
              key={issueId}
              issueId={issueId}
              issuesMap={issueMap}
              updateIssue={updateIssue}
              quickActions={renderQuickActions}
              canEditProperties={canEditProperties}
              displayProperties={displayProperties}
              nestingLevel={0}
              spacingLeft={0}
              containerRef={containerRef}
              selectionHelpers={{
                handleClearSelection: () => {},
                handleEntityClick: (event: React.MouseEvent, entityID: string, groupId: string) => {},
                getIsEntitySelected: (entityID: string) => false,
                getIsEntityActive: (entityID: string) => false,
                handleGroupClick: (groupID: string) => {},
                isGroupSelected: (groupID: string) => "empty",
                isSelectionDisabled: true,
              }}
              groupId={"1"}
              isLastChild={index === Object.keys(issueMap).length - 1}
              isDragAllowed={false}
              canDropOverIssue={false}
            />
          ))}
      </div>
      <IssuePeekOverview is_draft />
    </>
  );
});

export default Root;
