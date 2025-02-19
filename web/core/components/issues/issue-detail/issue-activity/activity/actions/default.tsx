"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { LayersIcon } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent } from "./";
// icons

type TIssueDefaultActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueDefaultActivity: FC<TIssueDefaultActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      activityId={activityId}
      icon={<LayersIcon width={14} height={14} className="text-custom-text-200" aria-hidden="true" />}
      ends={ends}
    >
      <>{activity.verb === "created" ? " created the work item." : " deleted a work item."}</>
    </IssueActivityBlockComponent>
  );
});
