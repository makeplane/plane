"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER, EActivityFilterType, filterActivityOnSelectedFilters } from "@plane/constants";
// hooks
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, TIssueActivityComment } from "@plane/types";
// components
import { ActivitySortRoot } from "@/components/issues";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
// local components
import { EpicActivityItem } from "./activity/activity-block";

type TEpicDetailActivityRootProps = {
  epicId: string;
};

export const EpicSidebarActivityRoot: FC<TEpicDetailActivityRootProps> = observer((props) => {
  const { epicId } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
    "epic_activity_sort_order",
    E_SORT_ORDER.ASC
  );
  // store hooks
  const {
    activity: { getActivityAndCommentsByIssueId },
    comment: {},
  } = useIssueDetail(EIssueServiceType.EPICS);

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);

  // derived values
  const activityComments = getActivityAndCommentsByIssueId(epicId, sortOrder ?? E_SORT_ORDER.ASC);

  const filteredActivityComments = filterActivityOnSelectedFilters(activityComments ?? [], [
    EActivityFilterType.ACTIVITY,
  ]);

  return (
    <SidebarContentWrapper
      title={t("activity")}
      actionElement={
        <ActivitySortRoot
          sortOrder={sortOrder ?? E_SORT_ORDER.ASC}
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
