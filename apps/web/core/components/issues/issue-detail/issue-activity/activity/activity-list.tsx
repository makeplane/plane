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
import { getValidKeysFromObject } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { useTimeLineRelationOptions } from "@/components/relations";
// local components
import {
  CustomerActivity,
  CustomerRequestActivity,
  EpicActivity,
  IssueArchivedAtActivity,
  IssueAssigneeActivity,
  IssueAttachmentActivity,
  IssueCycleActivity,
  IssueDefaultActivity,
  IssueDescriptionActivity,
  IssueEstimateActivity,
  IssueEstimateTimeActivity,
  IssueInboxActivity,
  IssueLabelActivity,
  IssueLinkActivity,
  IssueModuleActivity,
  IssueNameActivity,
  IssuePageActivity,
  IssueParentActivity,
  IssuePriorityActivity,
  IssueRelationActivity,
  IssueStartDateActivity,
  IssueStateActivity,
  IssueTargetDateActivity,
  IssueTypeActivity,
  MilestoneActivity,
  WorkItemConvertActivity,
} from "./actions";

type TIssueActivityItem = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export const IssueActivityItem = observer(function IssueActivityItem(props: TIssueActivityItem) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
    comment: {},
  } = useIssueDetail();
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  const activityRelations = getValidKeysFromObject(ISSUE_RELATION_OPTIONS);

  const componentDefaultProps = { activityId, ends };

  const activityField = getActivityById(activityId)?.field;
  switch (activityField) {
    case null: // default issue creation
      return <IssueDefaultActivity {...componentDefaultProps} />;
    case "state":
      return <IssueStateActivity {...componentDefaultProps} showIssue={false} />;
    case "name":
      return <IssueNameActivity {...componentDefaultProps} />;
    case "description":
      return <IssueDescriptionActivity {...componentDefaultProps} showIssue={false} />;
    case "assignees":
      return <IssueAssigneeActivity {...componentDefaultProps} showIssue={false} />;
    case "priority":
      return <IssuePriorityActivity {...componentDefaultProps} showIssue={false} />;
    case "estimate_points":
    case "estimate_categories":
    case "estimate_point" /* This case is to handle all the older recorded activities for estimates. Field changed from  "estimate_point" -> `estimate_${estimate_type}`*/:
      return <IssueEstimateActivity {...componentDefaultProps} showIssue={false} />;
    case "parent":
      return <IssueParentActivity {...componentDefaultProps} showIssue={false} />;
    case activityRelations.find((field) => field === activityField):
      return <IssueRelationActivity {...componentDefaultProps} />;
    case "start_date":
      return <IssueStartDateActivity {...componentDefaultProps} showIssue={false} />;
    case "target_date":
      return <IssueTargetDateActivity {...componentDefaultProps} showIssue={false} />;
    case "cycles":
      return <IssueCycleActivity {...componentDefaultProps} />;
    case "modules":
      return <IssueModuleActivity {...componentDefaultProps} />;
    case "labels":
      return <IssueLabelActivity {...componentDefaultProps} showIssue={false} />;
    case "link":
      return <IssueLinkActivity {...componentDefaultProps} showIssue={false} />;
    case "attachment":
      return <IssueAttachmentActivity {...componentDefaultProps} showIssue={false} />;
    case "archived_at":
      return <IssueArchivedAtActivity {...componentDefaultProps} />;
    case "intake":
    case "inbox":
      return <IssueInboxActivity {...componentDefaultProps} />;
    case "type":
      return <IssueTypeActivity {...componentDefaultProps} />;
    case "page":
      return <IssuePageActivity {...componentDefaultProps} />;
    case "estimate_time":
      return <IssueEstimateTimeActivity activityId={activityId} ends={ends} showIssue={false} />;
    case "customer":
      return <CustomerActivity activityId={activityId} ends={ends} />;
    case "customer_request":
      return <CustomerRequestActivity activityId={activityId} ends={ends} />;
    case "work_item":
      return <WorkItemConvertActivity activityId={activityId} ends={ends} />;
    case "epic":
      return <EpicActivity activityId={activityId} ends={ends} />;
    case "milestones":
      return <MilestoneActivity activityId={activityId} ends={ends} />;
    default:
      return <></>;
  }
});
