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
import { observer } from "mobx-react";
import { ArrowRightLeft } from "lucide-react";
// components
import { IssueActivityBlockComponent } from "@/components/issues/issue-detail/issue-activity/activity/actions";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type TWorkItemConvertActivity = {
  activityId: string;
  showIssue?: boolean;
  ends: "top" | "bottom" | undefined;
};

export const WorkItemConvertActivity = observer(function WorkItemConvertActivity(props: TWorkItemConvertActivity) {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<ArrowRightLeft className="h-3 w-3 flex-shrink-0 text-tertiary" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        converted{" "}
        <span className="text-primary font-medium">{`${activity?.project_detail?.identifier}-${activity?.issue_detail?.sequence_id}`}</span>{" "}
        to epic.
      </>
    </IssueActivityBlockComponent>
  );
});
