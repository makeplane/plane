"use client";
import React, { FC } from "react";
import { observer } from "mobx-react";
// plane web
import { EActivityFilterType, filterActivityOnSelectedFilters } from "@/plane-web/constants";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeActivity, TInitiativeActivityComment } from "@/plane-web/types/initiative";
// local components
import { InitiativeActivityItem } from "./activity/activity-block";

type Props = {
  initiativeId: string;
};

export const InitiativeSidebarActivityRoot: FC<Props> = observer((props) => {
  const { initiativeId } = props;
  // store hooks
  const {
    initiative: {
      initiativeCommentActivities: { getActivityCommentByIssueId },
    },
  } = useInitiatives();

  // derived values
  const activityComments = getActivityCommentByIssueId(initiativeId);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, [EActivityFilterType.ACTIVITY]);

  return (
    <div className="min-h-[200px]">
      {filteredActivityComments.map((activityComment, index) => {
        const currActivityComment = activityComment as TInitiativeActivityComment;
        return currActivityComment.activity_type === "ACTIVITY" ? (
          <InitiativeActivityItem
            key={currActivityComment.id}
            activity={currActivityComment.detail as TInitiativeActivity}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : (
          <></>
        );
      })}
    </div>
  );
});
