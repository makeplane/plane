"use client";

import { FC } from "react";
import { observer } from "mobx-react";

import { TProjectActivity } from "@/plane-web/types";
import { ActivityBlockComponent } from "./activity-block";
import { iconsMap, messages } from "./helper";

type TActivityItem = {
  activity: TProjectActivity;
  showProject?: boolean;
  ends?: "top" | "bottom" | undefined;
};

export const ActivityItem: FC<TActivityItem> = observer((props) => {
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
