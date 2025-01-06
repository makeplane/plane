"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// Plane-web
import { EActivityFilterType, filterActivityOnSelectedFilters } from "@/plane-web/constants";
// Services
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeActivity, TInitiativeActivityComment } from "@/plane-web/types/initiative";

import { InitiativeActivityBlock } from "./activity-block";
import { InitiativeActivityItem } from "./activity-items";

type TInitiativeSidebarActivityRootProps = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeSidebarActivityRoot: FC<TInitiativeSidebarActivityRootProps> = observer((props) => {
  const { workspaceSlug, initiativeId } = props;
  // hooks
  const {
    initiative: {
      initiativeCommentActivities: { getActivityCommentByIssueId },
    },
  } = useInitiatives();

  const activityComments = getActivityCommentByIssueId(initiativeId);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, [EActivityFilterType.ACTIVITY]);

  return (
    <div className="min-h-[200px]">
      {filteredActivityComments.map((activityComment, index) => {
        const currActivityComment = activityComment as TInitiativeActivityComment;
        return currActivityComment.activity_type === "ACTIVITY" ? (
          <InitiativeActivityBlock
            key={currActivityComment.id}
            activity={currActivityComment.detail as TInitiativeActivity}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          >
            <InitiativeActivityItem
              workspaceSlug={workspaceSlug}
              activity={currActivityComment.detail as TInitiativeActivity}
            />
          </InitiativeActivityBlock>
        ) : (
          <></>
        );
      })}
    </div>
  );
});
