"use client";

import { observer } from "mobx-react";
import { EIssueServiceType, TBaseActivityVerbs } from "@plane/types";
import { LayersIcon } from "@plane/ui";
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

  // adding this for conversion compatibility
  if (activity.field === null && activity.verb === "created") {
    return (
      <ActivityBlockComponent
        icon={<LayersIcon className="size-4 text-sm flex-shrink-0 text-custom-text-300" aria-hidden="true" />}
        activity={activity}
        ends={ends}
      >
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
