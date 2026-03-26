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

import { observer } from "mobx-react";
// plane imports
import { ActivityListItem } from "@plane/blocks/activity";
import { mapActivityToItemData } from "@/components/issues/issue-detail/issue-activity/helpers";
// hooks
import { getRelationActivityContent } from "@/components/relations/activity";
import { useRelationFieldNames, useRelationOptionByFieldName } from "@/components/relations/use-relation-activity";
import { useActivityHighlight } from "@/hooks/use-activity-highlight";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type IssueActivityItemProps = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export const IssueActivityItem = observer(function IssueActivityItem(props: IssueActivityItemProps) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { highlightRef, isHighlighted } = useActivityHighlight(activityId);
  const relationFieldNames = useRelationFieldNames();
  const getRelationOption = useRelationOptionByFieldName();

  const activity = getActivityById(activityId);

  if (!activity) return null;

  const baseData = mapActivityToItemData(activity);

  // Relation fields: resolve icon + content via hooks
  const field = activity.field;
  const data =
    field && relationFieldNames.has(field)
      ? {
          ...baseData,
          customContent: (
            <>
              {getRelationActivityContent(activity)}
              <span className="font-medium text-primary">
                {activity.old_value === "" ? activity.new_value : activity.old_value}.
              </span>
            </>
          ),
          icon: getRelationOption(field)?.icon(14) ?? undefined,
        }
      : baseData;

  return <ActivityListItem data={data} ends={ends} highlightRef={highlightRef} highlighted={isHighlighted} />;
});
