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
import { useParams } from "next/navigation";
// icons
import { ArrowRightLeft } from "lucide-react";
// plane imports
import { cn } from "@plane/utils";
// components
import {
  IssueActivityBlockComponent,
  IssueLink,
} from "@/components/issues/issue-detail/issue-activity/activity/actions";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web imports
import { IssueTypeLogo } from "@/components/work-item-types/common/issue-type-logo";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TIssueTypeDetail = {
  issueTypeId: string;
  className?: string;
};

const IssueTypeDetail = observer(function IssueTypeDetail(props: TIssueTypeDetail) {
  const { issueTypeId, className = "" } = props;
  // hooks
  const { getIssueTypeById } = useIssueTypes();
  // derived values
  const issueTypeDetail = getIssueTypeById(issueTypeId);

  return (
    <span className={cn("inline-flex gap-1 items-center font-medium text-primary", className)}>
      <IssueTypeLogo icon_props={issueTypeDetail?.logo_props?.icon} size="xs" isDefault={issueTypeDetail?.is_default} />
      {issueTypeDetail?.name}
    </span>
  );
});

export type TIssueTypeActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueTypeActivity = observer(function IssueTypeActivity(props: TIssueTypeActivity) {
  const { activityId, showIssue = false, ends } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { isWorkItemTypeEnabledForProject } = useIssueTypes();
  // derived values
  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const isWorkItemTypeEnabled =
    workspaceSlug && activity?.project
      ? isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), activity?.project)
      : false;

  if (!isWorkItemTypeEnabled) return <></>;

  return (
    <IssueActivityBlockComponent
      icon={<ArrowRightLeft className="h-3.5 w-3.5 flex-shrink-0 text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      <span className="inline-flex items-center">
        changed work item type to{" "}
        {activity.new_identifier && <IssueTypeDetail issueTypeId={activity.new_identifier} className="px-1" />}
        from {activity.old_identifier && <IssueTypeDetail issueTypeId={activity.old_identifier} className="pl-1" />}
        {showIssue ? ` for ` : ``}
        {showIssue && <IssueLink activityId={activityId} />}.
      </span>
    </IssueActivityBlockComponent>
  );
});
