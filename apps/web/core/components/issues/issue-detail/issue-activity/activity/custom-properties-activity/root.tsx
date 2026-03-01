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
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web hooks
import { getWorkItemCustomPropertyActivityMessage } from "@/helpers/workitem/activity";
import { useIssueTypes } from "@/plane-web/hooks/store";
// local imports
import { IssueActivityBlockComponent } from "./common";

type TWorkItemCustomPropertiesActivity = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export type TWorkItemCustomPropertiesActivityItem = {
  activityId: string;
  customPropertyId: string;
};

export const WorkItemCustomPropertiesActivity = observer(function WorkItemCustomPropertiesActivity(
  props: TWorkItemCustomPropertiesActivity
) {
  const { activityId, ends } = props;
  // hooks and derived values
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getIssuePropertyById } = useIssueTypes();
  const {
    activity: {
      issuePropertiesActivity: { getPropertyActivityById },
    },
  } = useIssueDetail();

  // activity details
  const activityDetail = getPropertyActivityById(activityId);
  if (!activityDetail || !activityDetail.issue || !activityDetail.property) return <></>;
  // issue details
  const issueDetail = getIssueById(activityDetail?.issue);
  if (!issueDetail) return <></>;
  // property details
  const propertyDetail = getIssuePropertyById(activityDetail?.property);
  if (!propertyDetail?.id) return <></>;
  // activity message
  const activityMessage = getWorkItemCustomPropertyActivityMessage({
    action: activityDetail.action,
    newValue: activityDetail.new_value,
    oldValue: activityDetail.old_value,
    propertyDetail,
    workspaceId: activityDetail.workspace,
  });

  if (!activityMessage) return <></>;

  return (
    <IssueActivityBlockComponent activityId={activityId} propertyId={propertyDetail.id} ends={ends}>
      {activityMessage}
    </IssueActivityBlockComponent>
  );
});
