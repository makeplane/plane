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
  const source = activity.source_data?.source;

  return (
    <IssueActivityBlockComponent
      activityId={activityId}
      icon={<LayersIcon width={14} height={14} className="text-custom-text-200" aria-hidden="true" />}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          source && source !== "IN_APP" ? (
            <span>
              created the work item via <span className="font-medium">{source.toLowerCase()}</span>.
            </span>
          ) : (
            <span> created the work item.</span>
          )
        ) : (
          <span> deleted a work item.</span>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
