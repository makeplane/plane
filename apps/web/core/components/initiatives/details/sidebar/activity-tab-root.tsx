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

import type { FC } from "react";
import React, { useMemo } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER, EActivityFilterType, filterActivityOnSelectedFilters } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
// components
import { useTranslation } from "@plane/i18n";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// plane web
import { SidebarContentWrapper } from "@/components/common/layout/sidebar/content-wrapper";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeActivity, TInitiativeActivityComment } from "@/types/initiative";
// local components
import { InitiativeActivityItem } from "./activity/activity-block";

type Props = {
  initiativeId: string;
};

export const InitiativeSidebarActivityRoot = observer(function InitiativeSidebarActivityRoot(props: Props) {
  const { initiativeId } = props;
  // states
  const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
    "initiative_activity_sort_order",
    E_SORT_ORDER.ASC
  );
  // store hooks
  const {
    initiative: {
      initiativeCommentActivities: { getActivityAndCommentByIssueId },
    },
  } = useInitiatives();

  const { t } = useTranslation();

  // derived values
  const activityComments = getActivityAndCommentByIssueId(initiativeId);

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
      title={t("activity")}
      actionElement={<ActivitySortRoot sortOrder={sortOrder ?? E_SORT_ORDER.ASC} toggleSort={toggleSortOrder} />}
    >
      <div className="min-h-[200px]">
        {sortedActivity.length > 0 &&
          sortedActivity.map((activityComment, index) => {
            const currActivityComment = activityComment as TInitiativeActivityComment;
            return currActivityComment.activity_type === "ACTIVITY" ? (
              <InitiativeActivityItem
                key={currActivityComment.id}
                activity={currActivityComment.detail}
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
