"use client";

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { TRecurringWorkItemActivity } from "@plane/types";
import { getRecurringWorkItemActivityKey } from "@plane/utils";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
// local imports
import { RECURRING_WORK_ITEM_ACTIVITY_HELPER_MAP } from "./activity-helpers";

type TRecurringWorkItemActivityItemProps = {
  activity: TRecurringWorkItemActivity;
  ends: "top" | "bottom" | undefined;
};

export const RecurringWorkItemActivityItem = observer((props: TRecurringWorkItemActivityItemProps) => {
  const { activity, ends } = props;
  // return if activity details are not available
  if (!activity) return <></>;
  // derived values
  const recurringWorkItemActivityKey = getRecurringWorkItemActivityKey(activity.field, activity.verb);
  const getRecurringWorkItemActivity = RECURRING_WORK_ITEM_ACTIVITY_HELPER_MAP[recurringWorkItemActivityKey];

  if (getRecurringWorkItemActivity) {
    const { icon, message, customUserName } = getRecurringWorkItemActivity(activity);
    return (
      <ActivityBlockComponent icon={icon} activity={activity} ends={ends} customUserName={customUserName}>
        <>{message}</>
      </ActivityBlockComponent>
    );
  }

  return <></>;
});
