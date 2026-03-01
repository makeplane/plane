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
import { TriangleAlert } from "lucide-react";
import { LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import { LayersIcon } from "@plane/propel/icons";
import type { TBaseActivityVerbs, TWorkspaceBaseActivity } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
// helpers
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { getWorkItemCustomPropertyActivityMessage } from "@/helpers/workitem/activity";
import { useIssueTypes } from "@/plane-web/hooks/store";
import type { TEpicActivityFields } from "./helper";
import { getEpicActivityKey, EPIC_UPDATES_HELPER_MAP } from "./helper";

type TEpicActivityItemProps = {
  id: string;
  ends: "top" | "bottom" | undefined;
};

type TEpicAdditionalPropertiesActivityProps = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
};

export const EpicActivityItem = observer(function EpicActivityItem(props: TEpicActivityItemProps) {
  const { id, ends } = props;

  const {
    activity: { getActivityById },
  } = useIssueDetail(EIssueServiceType.EPICS);

  const activity = getActivityById(id);

  // return if activity details are not available
  if (!activity) return <></>;
  // derived values
  const initiativeActivityKey = getEpicActivityKey(
    activity.field as TEpicActivityFields,
    activity.verb as TBaseActivityVerbs
  );
  const getEpicActivity = EPIC_UPDATES_HELPER_MAP[initiativeActivityKey];

  // adding this for conversion compatibility
  if (activity.field === null && activity.verb === "created") {
    return (
      <ActivityBlockComponent icon={LayersIcon} activity={activity} ends={ends}>
        <span> created the work item.</span>
      </ActivityBlockComponent>
    );
  }

  if (getEpicActivity) {
    const { icon, message, customUserName } = getEpicActivity(activity);
    return (
      <ActivityBlockComponent icon={icon} activity={activity} ends={ends} customUserName={customUserName}>
        <>{message}</>
      </ActivityBlockComponent>
    );
  }

  return <></>;
});

export const EpicAdditionalPropertiesActivity: FC<TEpicAdditionalPropertiesActivityProps> = observer((props) => {
  const { activityId, ends } = props;
  const { getIssuePropertyById } = useIssueTypes();
  const {
    activity: {
      issuePropertiesActivity: { getPropertyActivityById },
    },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // activity details
  const activityDetail = getPropertyActivityById(activityId);
  if (!activityDetail || !activityDetail.issue || !activityDetail.property) return <></>;

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

  const activity: TWorkspaceBaseActivity = {
    ...activityDetail.asJSON,
    id: activityDetail.id ?? "",
    field: activityDetail.property,
    verb: activityDetail.action || "",
    epoch: activityDetail.epoch || 0,
    actor: activityDetail.actor || "",
    created_at: activityDetail.created_at || new Date().toISOString(),
    updated_at: activityDetail.updated_at || activityDetail.created_at || new Date().toISOString(),
    workspace: activityDetail.workspace || "",
  };

  const Icon =
    LUCIDE_ICONS_LIST.find((item) => item.name === propertyDetail.logo_props?.icon?.name)?.element ?? TriangleAlert;

  return (
    <ActivityBlockComponent
      icon={Icon}
      activity={activity}
      ends={ends}
      customUserName={activityDetail.actor_detail?.display_name}
    >
      {activityMessage}
    </ActivityBlockComponent>
  );
});
