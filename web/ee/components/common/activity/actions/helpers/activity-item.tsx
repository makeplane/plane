"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";

import { TProjectActivity } from "@/plane-web/types";
import { ActivityBlockComponent } from "./activity-block";

type TActivityItem = {
  activity: TProjectActivity;
  showProject?: boolean;
  ends?: "top" | "bottom" | undefined;
  iconsMap: Record<string, ReactNode>;
  messages: (activity: TProjectActivity) => { message: ReactNode; customUserName?: string };
};

export const ActivityItem: FC<TActivityItem> = observer((props) => {
  const { activity, showProject = true, ends, messages, iconsMap } = props;

  if (!activity) return null;

  const activityType = activity.field;
  const { message, customUserName } = messages(activity);
  const icon = iconsMap[activityType] || iconsMap.default;

  return (
    <ActivityBlockComponent icon={icon} activity={activity} ends={ends} customUserName={customUserName}>
      <>
        {message}
        {activityType !== "project" && showProject && " for project "}
        <span className="font-normal">{activity.project_detail?.name}</span>
      </>
    </ActivityBlockComponent>
  );
});
