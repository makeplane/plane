"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TIssueActivityComment } from "@plane/types";
// constants
import { TSORT_ORDER } from "@/constants/common";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
// constants
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
  // store hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: {},
  } = useIssueDetail(EIssueServiceType.EPICS);

  const { getProjectById } = useProject();

  // helper hooks
  const activityOperations = useEpicActivityOperations(workspaceSlug, projectId, epicId);

  // derived values
  const project = getProjectById(projectId);
  const activityComments = getActivityCommentByIssueId(epicId, TSORT_ORDER.ASC);

  if (!project) return <></>;

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, [EActivityFilterType.COMMENT]);

  return (
    <>
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
        {filteredActivityComments.map((activityComment) => {
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
    </>
  );
});
