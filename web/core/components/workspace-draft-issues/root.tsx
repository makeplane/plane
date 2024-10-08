"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { EUserPermissions, EUserPermissionsLevel } from "ee/constants/user-permissions";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues, useUserPermissions } from "@/hooks/store";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import useLocalStorage from "@/hooks/use-local-storage";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { IssueBlockRoot, IssuePeekOverview, WorkspaceDraftIssueQuickActions } from "../issues";
import { TRenderQuickActions } from "../issues/issue-layouts/list/list-view-types";

export const WorkspaceDraftIssueRoot = observer(() => {
  const storeType = useIssueStoreType() as EIssuesStoreType.WORKSPACE_DRAFT;

  const { workspaceSlug } = useParams();
  const { issueMap } = useIssues(EIssuesStoreType.WORKSPACE_DRAFT);

  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);

  const { fetchIssues, updateIssue, removeIssue, moveToIssue } = useIssuesActions(storeType);

  const { allowPermissions } = useUserPermissions();

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

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const canEditProperties = (projectId: string | undefined) => true;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef }) => (
      <WorkspaceDraftIssueQuickActions
        parentRef={parentRef}
        issue={issue}
        handleDelete={async () => removeIssue(workspaceSlug.toString(), issue.id)}
        handleUpdate={async (data: Partial<TIssue>) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleMoveToIssues={async () => moveToIssue && moveToIssue(workspaceSlug.toString(), issue.id, issue)}
        readOnly={!isEditingAllowed}
      />
    ),
    [removeIssue, isEditingAllowed, updateIssue, workspaceSlug, moveToIssue]
  );

  // const loadMoreIssues = useCallback(
  //   (groupId?: string) => {
  //     fetchNextIssues(groupId);
  //   },
  //   [fetchNextIssues]
  // );

  const { storedValue: isBannerHidden, setValue: hideBanner } = useLocalStorage<boolean>("isBannerHidden", false);

  useEffect(() => {
    if (!isBannerHidden) {
      hideBanner(true);
    }
  }, [isBannerHidden, hideBanner]);
  return (
    <>
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
              displayProperties={undefined}
              nestingLevel={0}
              spacingLeft={0}
              containerRef={containerRef}
              selectionHelpers={{
                handleClearSelection: () => {},
                handleEntityClick: () => {},
                getIsEntitySelected: () => false,
                getIsEntityActive: () => false,
                handleGroupClick: () => {},
                isGroupSelected: () => "empty",
                isSelectionDisabled: true,
              }}
              groupId={"1"}
              isLastChild={index === Object.keys(issueMap).length - 1}
              isDragAllowed={false}
              canDropOverIssue={false}
              isDraft
            />
          ))}
      </div>
      <IssuePeekOverview isDraft />
    </>
  );
});
