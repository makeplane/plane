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

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane package imports
import { ActivityFeed } from "@plane/blocks/activity";
import type { TActivityFilters, TActivityFilterOptionsKey } from "@plane/constants";
import {
  E_SORT_ORDER,
  defaultActivityFilters,
  EActivityFilterType,
  EUserPermissions,
  ACTIVITY_FILTER_TYPE_OPTIONS,
} from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import type { TFileSignedURLResponse, TIssueComment } from "@plane/types";
// components
import { CommentCreate } from "@/components/comments/comment-create";
import { IssueActivityWorklogCreateButton } from "@/components/issues/worklog/activity/worklog-create-button";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
// local imports
import { ActivityFilter } from "./activity-filter";
import { IssueActivityCommentRoot } from "./activity-comment-root";
import { useWorkItemCommentOperations } from "./helper";
import { ActivitySortRoot } from "./sort-root";

type IssueActivityProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  isIntakeIssue?: boolean;
};

export type ActivityOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<TIssueComment>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (blockId: string, file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
};

type IssueActivityTab = {
  key: string;
  label: string;
  filters: TActivityFilters[];
  renderMode?: "default" | "transition";
};

const DEFAULT_ACTIVITY_TAB = "all";
const FILTER_VISIBLE_TABS = new Set([DEFAULT_ACTIVITY_TAB, "activity", "comment"]);

export const IssueActivity = observer(function IssueActivity(props: IssueActivityProps) {
  const { workspaceSlug, projectId, issueId, disabled = false, isIntakeIssue = false } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { setValue: setSortOrder, storedValue: sortOrder } = useLocalStorage("activity_sort_order", E_SORT_ORDER.ASC);
  // store hooks
  const { getProjectById } = useProject();
  const { isWorklogsEnabledByProjectId } = useWorkspaceWorklogs();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const isWorklogsEnabled = (projectId && isWorklogsEnabledByProjectId(projectId)) || false;
  const currentUserProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isGuest = currentUserProjectRole === EUserPermissions.GUEST;
  const isAdmin = currentUserProjectRole === EUserPermissions.ADMIN;
  const isAssigned = issue?.assignee_ids && currentUser?.id ? issue.assignee_ids.includes(currentUser.id) : false;
  const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && (isAdmin || isAssigned);

  // Build activity tabs
  const activityTabs: IssueActivityTab[] = useMemo(() => {
    const allFilters = Object.keys(ACTIVITY_FILTER_TYPE_OPTIONS) as TActivityFilters[];
    const availableFilters = allFilters.filter((f) => {
      if ((!isWorklogsEnabled || isIntakeIssue) && f === EActivityFilterType.WORKLOG) return false;
      return true;
    });
    const activityOnlyFilters = [
      EActivityFilterType.ACTIVITY,
      EActivityFilterType.STATE,
      EActivityFilterType.ASSIGNEE,
      EActivityFilterType.ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY,
    ];

    const tabs: IssueActivityTab[] = [
      { key: "all", label: t("common.all"), filters: availableFilters },
      {
        key: "activity",
        label: t("common.activity"),
        filters: activityOnlyFilters,
      },
      {
        key: "comment",
        label: t("common.comments"),
        filters: [EActivityFilterType.COMMENT],
      },
    ];

    if (isWorklogsEnabled && !isIntakeIssue) {
      tabs.push({
        key: "worklog",
        label: t("common.worklogs"),
        filters: [EActivityFilterType.WORKLOG],
      });
    }

    tabs.push(
      {
        key: "transition",
        label: t("transition"),
        filters: [EActivityFilterType.STATE],
        renderMode: "transition",
      },
      {
        key: "history",
        label: t("history"),
        filters: activityOnlyFilters,
        renderMode: "transition",
      }
    );

    return tabs;
  }, [isWorklogsEnabled, isIntakeIssue, t]);

  // Track active tab key separately (needed because multiple tabs can share the same filters)
  const { setValue: setActiveTabKey, storedValue: activeTabKey } = useLocalStorage(
    "issue_activity_active_tab",
    DEFAULT_ACTIVITY_TAB
  );

  // Additional filter toggles (e.g., Assignee) — tracked separately from tab base filters
  const [additionalFilters, setAdditionalFilters] = useState<TActivityFilters[]>([]);

  const handleTabChange = (key: string) => {
    const tab = activityTabs.find((t) => t.key === key);
    if (tab) {
      setActiveTabKey(key);
      setAdditionalFilters([]);
    }
  };

  // Derive filters and render mode from active tab (single source of truth)
  const activeTab = activityTabs.find((t) => t.key === activeTabKey);
  const activeTabBaseFilters = activeTab?.filters ?? defaultActivityFilters;
  const selectedFilters = [...activeTabBaseFilters, ...additionalFilters];
  const activeRenderMode = activeTab?.renderMode ?? "default";

  const toggleSort = useCallback(() => {
    setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);
  }, [sortOrder, setSortOrder]);

  const showFilter = FILTER_VISIBLE_TABS.has(activeTabKey || DEFAULT_ACTIVITY_TAB);

  const filterOptions = useMemo(() => {
    const toggleableFilters = [EActivityFilterType.ASSIGNEE] as TActivityFilters[];
    return toggleableFilters.map((key) => ({
      ...ACTIVITY_FILTER_TYPE_OPTIONS[key as TActivityFilterOptionsKey],
      key,
      isSelected: additionalFilters.includes(key),
      onClick: () => {
        setAdditionalFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
      },
    }));
  }, [additionalFilters]);

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
    <div className="py-8">
      <ActivityFeed
        tabs={activityTabs}
        activeTab={activeTabKey || DEFAULT_ACTIVITY_TAB}
        onTabChange={handleTabChange}
        actionsElement={
          <>
            {isWorklogButtonEnabled && (
              <IssueActivityWorklogCreateButton
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                disabled={disabled}
              />
            )}
            {showFilter && (
              <ActivityFilter
                selectedFilters={selectedFilters || defaultActivityFilters}
                filterOptions={filterOptions}
              />
            )}
            <ActivitySortRoot sortOrder={sortOrder || E_SORT_ORDER.ASC} toggleSort={toggleSort} />
          </>
        }
      >
        <div className="flex flex-col gap-5 py-6">
          <div className="min-h-[200px]">
            <div className="space-y-3">
              {!disabled &&
                sortOrder === E_SORT_ORDER.DESC &&
                (activeTabKey === "all" || activeTabKey === "comment") &&
                renderCommentCreationBox}
              <IssueActivityCommentRoot
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                isIntakeIssue={isIntakeIssue}
                issueId={issueId}
                selectedFilters={selectedFilters || defaultActivityFilters}
                activityOperations={activityOperations}
                showAccessSpecifier={!!project.anchor}
                disabled={disabled}
                sortOrder={sortOrder || E_SORT_ORDER.ASC}
                renderMode={activeRenderMode}
                activeTabKey={activeTabKey || DEFAULT_ACTIVITY_TAB}
              />
              {!disabled &&
                sortOrder === E_SORT_ORDER.ASC &&
                (activeTabKey === "all" || activeTabKey === "comment") &&
                renderCommentCreationBox}
            </div>
          </div>
        </div>
      </ActivityFeed>
    </div>
  );
});
