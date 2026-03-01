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

import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TRecurringWorkItemActivity } from "@plane/types";
import { getRecurringWorkItemActivityKey } from "@plane/utils";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
// local imports
import { RECURRING_WORK_ITEM_ACTIVITY_HELPER_MAP } from "./activity-helpers";

type TRecurringWorkItemActivityItemProps = {
  activity: TRecurringWorkItemActivity;
  ends: "top" | "bottom" | undefined;
};

export const RecurringWorkItemActivityItem = observer(function RecurringWorkItemActivityItem(
  props: TRecurringWorkItemActivityItemProps
) {
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
