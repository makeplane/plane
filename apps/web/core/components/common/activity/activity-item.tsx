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

import type { TProjectActivity } from "@/types";
import { ActivityBlockComponent } from "./activity-block";
import { iconsMap, messages } from "./helper";

type TActivityItem = {
  activity: TProjectActivity;
  showProject?: boolean;
  ends?: "top" | "bottom" | undefined;
};

export const ActivityItem = observer(function ActivityItem(props: TActivityItem) {
  const { activity, showProject = true, ends } = props;

  if (!activity) return null;

  const activityType = activity.field;
  if (!activityType) return null;

  const { message, customUserName } = messages(activity);
  const icon = iconsMap[activityType] || iconsMap.default;

  return (
    <ActivityBlockComponent icon={icon} activity={activity} ends={ends} customUserName={customUserName}>
      <>{message}</>
    </ActivityBlockComponent>
  );
});
