"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TIssueActivityComment } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web
import { EActivityFilterType, filterActivityOnSelectedFilters } from "@/plane-web/constants";
// local components
import { EpicActivityItem } from "./activity/activity-block";

type TEpicDetailActivityRootProps = {
  epicId: string;
};

export const EpicSidebarActivityRoot: FC<TEpicDetailActivityRootProps> = observer((props) => {
  const { epicId } = props;
  // store hooks
  const {
    activity: { getActivityCommentByIssueId, sortOrder },
    comment: {},
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const activityComments = getActivityCommentByIssueId(epicId, sortOrder);

  if (!activityComments || (activityComments && activityComments.length <= 0)) return <></>;

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments, [EActivityFilterType.ACTIVITY]);

  return (
    <div className="min-h-[200px]">
      {filteredActivityComments.map((activityComment, index) => {
        const currActivityComment = activityComment as TIssueActivityComment;
        return currActivityComment.activity_type === "ACTIVITY" ? (
          <EpicActivityItem
            key={currActivityComment.id}
            id={currActivityComment.id}
            ends={index === 0 ? "top" : index === filteredActivityComments.length - 1 ? "bottom" : undefined}
          />
        ) : (
          <></>
        );
      })}
    </div>
  );
});
