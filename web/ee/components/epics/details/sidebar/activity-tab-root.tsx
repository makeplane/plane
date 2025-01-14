"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane package imports
import { EIssueServiceType, E_SORT_ORDER } from "@plane/constants";
import { TIssueActivityComment } from "@plane/types";
// components
import { ActivitySortRoot } from "@/components/issues";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
import { EActivityFilterType, filterActivityOnSelectedFilters } from "@/plane-web/constants";
// local components
import { EpicActivityItem } from "./activity/activity-block";

type TEpicDetailActivityRootProps = {
  epicId: string;
};

export const EpicSidebarActivityRoot: FC<TEpicDetailActivityRootProps> = observer((props) => {
  const { epicId } = props;
  // states
  const [sortOrder, setSortOrder] = React.useState<E_SORT_ORDER>(E_SORT_ORDER.ASC);
  // store hooks
  const {
    activity: { getActivityCommentByIssueId },
    comment: {},
  } = useIssueDetail(EIssueServiceType.EPICS);

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);

  // derived values
  const activityComments = getActivityCommentByIssueId(epicId, sortOrder);

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments ?? [], [
    EActivityFilterType.ACTIVITY,
  ]);

  return (
    <SidebarContentWrapper
      title="Activity"
      actionElement={
        <ActivitySortRoot
          sortOrder={sortOrder}
          toggleSort={toggleSortOrder}
          className="flex-shrink-0"
          iconClassName="size-3"
        />
      }
    >
      <div className="min-h-[200px]">
        {filteredActivityComments.length > 0 &&
          filteredActivityComments.map((activityComment, index) => {
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
    </SidebarContentWrapper>
  );
});
