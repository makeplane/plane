"use client";
import React, { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
// components
import { ActivitySortRoot } from "@/components/issues";
// plane web
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
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
  // states
  const [sortOrder, setSortOrder] = useState<E_SORT_ORDER>(E_SORT_ORDER.ASC);
  // store hooks
  const {
    initiative: {
      initiativeCommentActivities: { getActivityCommentByIssueId },
    },
  } = useInitiatives();

  // derived values
  const activityComments = getActivityCommentByIssueId(initiativeId);

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments ?? [], [
    EActivityFilterType.ACTIVITY,
  ]);

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);

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
        {sortedActivity.length > 0 &&
          sortedActivity.map((activityComment, index) => {
            const currActivityComment = activityComment as TInitiativeActivityComment;
            return currActivityComment.activity_type === "ACTIVITY" ? (
              <InitiativeActivityItem
                key={currActivityComment.id}
                activity={currActivityComment.detail as TInitiativeActivity}
                ends={index === 0 ? "top" : index === sortedActivity.length - 1 ? "bottom" : undefined}
              />
            ) : (
              <></>
            );
          })}
      </div>
    </SidebarContentWrapper>
  );
});
