"use client";

import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { TBaseActivityVerbs } from "@plane/types";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
// helpers
import { useIssueDetail } from "@/hooks/store";
import { getEpicActivityKey, EPIC_UPDATES_HELPER_MAP, TEpicActivityFields } from "./helper";

type TEpicActivityItemProps = {
  id: string;
  ends: "top" | "bottom" | undefined;
};

export const EpicActivityItem = observer((props: TEpicActivityItemProps) => {
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
