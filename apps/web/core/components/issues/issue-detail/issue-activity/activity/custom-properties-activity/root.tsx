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
import Link from "next/link";
// plane imports
import { ActivityListItem } from "@plane/blocks/activity";
import type { ActivityItemData } from "@plane/blocks/activity";
import { calculateTimeAgo, getIssuePropertyTypeDetails, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useActivityHighlight } from "@/hooks/use-activity-highlight";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { PropertyTypeIcon } from "@/components/work-item-types/properties/property-icon";
import { getWorkItemCustomPropertyActivityMessage } from "@/helpers/workitem/activity";
import { useIssueTypes } from "@/plane-web/hooks/store";

type WorkItemCustomPropertiesActivityProps = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export type WorkItemCustomPropertiesActivityItemProps = {
  activityId: string;
  customPropertyId: string;
};

export const WorkItemCustomPropertiesActivity = observer(function WorkItemCustomPropertiesActivity(
  props: WorkItemCustomPropertiesActivityProps
) {
  const { activityId, ends } = props;
  // hooks
  const { highlightRef, isHighlighted } = useActivityHighlight(activityId);
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getIssuePropertyById } = useIssueTypes();
  const {
    activity: {
      issuePropertiesActivity: { getPropertyActivityById },
    },
  } = useIssueDetail();
  const { getWorkspaceById } = useWorkspace();

  // activity details
  const activityDetail = getPropertyActivityById(activityId);
  if (!activityDetail || !activityDetail.issue || !activityDetail.property) return <></>;
  // issue details
  const issueDetail = getIssueById(activityDetail.issue);
  if (!issueDetail) return <></>;
  // property details
  const propertyDetail = getIssuePropertyById(activityDetail.property);
  if (!propertyDetail?.id) return <></>;
  // property type details for icon
  const propertyTypeDetails = getIssuePropertyTypeDetails(propertyDetail.property_type, propertyDetail.relation_type);
  // activity message
  const activityMessage = getWorkItemCustomPropertyActivityMessage({
    action: activityDetail.action,
    newValue: activityDetail.new_value,
    oldValue: activityDetail.old_value,
    propertyDetail,
    workspaceId: activityDetail.workspace,
  });

  if (!activityMessage) return <></>;

  // resolve workspace slug for actor URL
  const workspaceDetail = activityDetail.workspace ? getWorkspaceById(activityDetail.workspace) : undefined;
  const actorUrl =
    workspaceDetail?.slug && activityDetail.actor_detail?.id
      ? `/${workspaceDetail.slug}/profile/${activityDetail.actor_detail.id}`
      : undefined;

  const actorName = activityDetail.actor_detail?.display_name ?? "";
  const actor = actorUrl ? (
    <Link href={actorUrl} className="font-medium text-primary hover:underline">
      {actorName}
    </Link>
  ) : (
    <span className="font-medium text-primary">{actorName}</span>
  );

  const data: ActivityItemData = {
    actor,
    timestamp: activityDetail.created_at ? calculateTimeAgo(activityDetail.created_at) : "",
    tooltipTimestamp: activityDetail.created_at
      ? `${renderFormattedDate(activityDetail.created_at)}, ${renderFormattedTime(activityDetail.created_at)}`
      : undefined,
    icon: propertyTypeDetails?.iconKey ? (
      <PropertyTypeIcon iconKey={propertyTypeDetails.iconKey} className="size-3.5 text-secondary" />
    ) : undefined,
    customContent: activityMessage,
  };

  return <ActivityListItem data={data} ends={ends} highlightRef={highlightRef} highlighted={isHighlighted} />;
});
