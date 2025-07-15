"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER, EActivityFilterType, filterActivityOnSelectedFilters } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType } from "@plane/types";
// components
import { CommentsWrapper } from "@/components/comments";
import { ActivitySortRoot } from "@/components/issues";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// constants
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
// local components
import { useCommentOperations } from "./helper";

type TEpicSidebarCommentsRootProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicSidebarCommentsRoot: FC<TEpicSidebarCommentsRootProps> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
    "epic_comments_sort_order",
    E_SORT_ORDER.ASC
  );
  // store hooks
  const {
    activity: { getActivityAndCommentsByIssueId },
    comment: { getCommentById },
  } = useIssueDetail(EIssueServiceType.EPICS);

  const { getProjectById } = useProject();

  // helper hooks
  const activityOperations = useCommentOperations(workspaceSlug, projectId, epicId);

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);

  // derived values
  const project = getProjectById(projectId);
  const activityComments = getActivityAndCommentsByIssueId(epicId, E_SORT_ORDER.ASC);

  if (!project) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments ?? [], [
    EActivityFilterType.COMMENT,
  ]);

  const sortedActivity = useMemo(
    () =>
      filteredActivityComments
        ? sortOrder === E_SORT_ORDER.DESC
          ? [...filteredActivityComments].reverse()
          : filteredActivityComments
        : [],
    [sortOrder, filteredActivityComments]
  );

  return (
    <SidebarContentWrapper
      title={t("comments")}
      actionElement={
        <ActivitySortRoot
          sortOrder={sortOrder ?? E_SORT_ORDER.ASC}
          toggleSort={toggleSortOrder}
          className="flex-shrink-0"
          iconClassName="size-3"
        />
      }
    >
      <CommentsWrapper
        entityId={epicId}
        activityOperations={activityOperations}
        comments={sortedActivity
          .filter((activityComment) => activityComment.activity_type === "COMMENT")
          .map((comment) => comment.id)}
        sortOrder={sortOrder ?? E_SORT_ORDER.ASC}
        isEditingAllowed={!disabled}
        getCommentById={getCommentById}
        projectId={projectId}
        showCopyLinkOption={false}
      />
    </SidebarContentWrapper>
  );
});
