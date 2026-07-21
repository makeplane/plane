/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane package imports
import type { TActivityFilters } from "@plane/constants";
import { E_SORT_ORDER, EActivityFilterType, EUserPermissions } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
//types
import type { TFileSignedURLResponse, TIssueComment } from "@plane/types";
// components
import { CommentCreate } from "@/components/comments/comment-create";
import { IssueCustomFieldsTab } from "@/components/custom-fields";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// worklog components
import { IssueActivityWorklogCreateButton } from "@/components/issues/worklog/activity/worklog-create-button";
import { IssueWorklogList } from "@/components/issues/worklog/activity/worklog-list";
// local imports
import type { TActivityTab } from "./activity-tab-bar";
import { ActivityTabBar } from "./activity-tab-bar";
import { IssueActivityCommentRoot } from "./activity-comment-root";
import { useWorkItemCommentOperations } from "./helper";
import { ActivitySortRoot } from "./sort-root";

// each tab maps to the set of activity types it shows in the feed
const TAB_FILTER_MAP: Record<Exclude<TActivityTab, "worklogs" | "custom_fields">, TActivityFilters[]> = {
  all: [
    EActivityFilterType.ACTIVITY,
    EActivityFilterType.COMMENT,
    EActivityFilterType.STATE,
    EActivityFilterType.ASSIGNEE,
    EActivityFilterType.WORKLOG,
  ],
  activity: [EActivityFilterType.ACTIVITY, EActivityFilterType.STATE, EActivityFilterType.ASSIGNEE],
  comments: [EActivityFilterType.COMMENT],
};

type TIssueActivity = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  isIntakeIssue?: boolean;
};

export type TActivityOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<TIssueComment>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (blockId: string, file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
};

export const IssueActivity = observer(function IssueActivity(props: TIssueActivity) {
  const { workspaceSlug, projectId, issueId, disabled = false, isIntakeIssue = false } = props;
  // hooks
  const { setValue: setActiveTab, storedValue: storedTab } = useLocalStorage<TActivityTab>("issue_activity_tab", "all");
  const activeTab: TActivityTab = storedTab ?? "all";
  const { setValue: setSortOrder, storedValue: sortOrder } = useLocalStorage("activity_sort_order", E_SORT_ORDER.ASC);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { getProjectById } = useProject();
  const { data: currentUser } = useUser();
  // derived values
  const issue = issueId ? getIssueById(issueId) : undefined;
  const currentUserProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isAdmin = currentUserProjectRole === EUserPermissions.ADMIN;
  const isGuest = currentUserProjectRole === EUserPermissions.GUEST;
  const isAssigned = issue?.assignee_ids && currentUser?.id ? issue?.assignee_ids.includes(currentUser?.id) : false;
  const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && (isAdmin || isAssigned);
  // intake issues don't support worklogs, so drop that tab there
  const tabs: TActivityTab[] = isIntakeIssue
    ? ["all", "activity", "comments", "custom_fields"]
    : ["all", "activity", "comments", "worklogs", "custom_fields"];
  const selectedFilters: TActivityFilters[] =
    activeTab === "worklogs" || activeTab === "custom_fields" ? [] : TAB_FILTER_MAP[activeTab];
  // comment composer only makes sense on the All and Comments tabs
  const showCommentBox = !disabled && (activeTab === "all" || activeTab === "comments");

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);
  };

  // helper hooks
  const activityOperations = useWorkItemCommentOperations(workspaceSlug, projectId, issueId);

  const project = getProjectById(projectId);
  const renderCommentCreationBox = useMemo(
    () => (
      <CommentCreate
        workspaceSlug={workspaceSlug}
        entityId={issueId}
        activityOperations={activityOperations}
        showToolbarInitially
        projectId={projectId}
      />
    ),
    [workspaceSlug, issueId, activityOperations, projectId]
  );
  if (!project) return <></>;

  return (
    <div className="space-y-4">
      {/* header: tab bar + actions — the tab strip absorbs the narrow-screen squeeze
          (it scrolls internally) so the actions stay put and reachable */}
      <div className="flex items-end justify-between gap-2">
        <ActivityTabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
        <div className="flex shrink-0 items-center gap-2 pb-1">
          {isWorklogButtonEnabled && (
            <IssueActivityWorklogCreateButton
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={disabled}
            />
          )}
          {activeTab !== "worklogs" && activeTab !== "custom_fields" && (
            <ActivitySortRoot sortOrder={sortOrder || E_SORT_ORDER.ASC} toggleSort={toggleSortOrder} />
          )}
        </div>
      </div>

      {/* rendering activity */}
      <div className="space-y-3">
        <div className="min-h-[200px]">
          {activeTab === "worklogs" ? (
            <IssueWorklogList workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
          ) : activeTab === "custom_fields" ? (
            <IssueCustomFieldsTab
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={disabled}
            />
          ) : (
            <div className="space-y-3">
              {showCommentBox && sortOrder === E_SORT_ORDER.DESC && renderCommentCreationBox}
              <IssueActivityCommentRoot
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                isIntakeIssue={isIntakeIssue}
                issueId={issueId}
                selectedFilters={selectedFilters}
                activityOperations={activityOperations}
                showAccessSpecifier={!!project.anchor}
                disabled={disabled}
                sortOrder={sortOrder || E_SORT_ORDER.ASC}
              />
              {showCommentBox && sortOrder === E_SORT_ORDER.ASC && renderCommentCreationBox}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
