"use client";

import React, { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane package imports
import { EIssueServiceType, E_SORT_ORDER } from "@plane/constants";
import { TIssueActivityComment } from "@plane/types";
// components
import { ActivitySortRoot } from "@/components/issues";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// constants
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
import { EActivityFilterType, filterActivityOnSelectedFilters } from "@/plane-web/constants";
// local components
import { EpicCommentCard } from "./activity/comment-card";
import { EpicCommentCreate } from "./activity/comment-create";
import { useEpicActivityOperations } from "./helper";

type TEpicSidebarCommentsRootProps = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicSidebarCommentsRoot: FC<TEpicSidebarCommentsRootProps> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // states
  const [sortOrder, setSortOrder] = useState<E_SORT_ORDER>(E_SORT_ORDER.ASC);
  // store hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: {},
  } = useIssueDetail(EIssueServiceType.EPICS);

  const { getProjectById } = useProject();

  // helper hooks
  const activityOperations = useEpicActivityOperations(workspaceSlug, projectId, epicId);

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);

  // derived values
  const project = getProjectById(projectId);
  const activityComments = getActivityCommentByIssueId(epicId, E_SORT_ORDER.ASC);

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
      title="Comments"
      actionElement={
        <ActivitySortRoot
          sortOrder={sortOrder}
          toggleSort={toggleSortOrder}
          className="flex-shrink-0"
          iconClassName="size-3"
        />
      }
    >
      <div className="space-y-5 min-h-[200px] w-full">
        {!disabled && (
          <EpicCommentCreate
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            epicId={epicId}
            activityOperations={activityOperations}
            showAccessSpecifier={!!project.anchor}
          />
        )}
        {sortedActivity.length > 0 &&
          sortedActivity.map((activityComment) => {
            const currActivityComment = activityComment as TIssueActivityComment;
            return currActivityComment.activity_type === "COMMENT" ? (
              <EpicCommentCard
                key={currActivityComment.id}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                commentId={currActivityComment.id}
                activityOperations={activityOperations}
                showAccessSpecifier={!!project.anchor}
                disabled={disabled}
              />
            ) : (
              <></>
            );
          })}
      </div>
    </SidebarContentWrapper>
  );
});
