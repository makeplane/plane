"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { ContrastIcon } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent } from "./";
// icons

type TIssueCycleActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueCycleActivity: FC<TIssueCycleActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<ContrastIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>added this issue to the cycle </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
            >
              <span className="truncate">{activity.new_value}</span>
            </a>
          </>
        ) : activity.verb === "updated" ? (
          <>
            <span>set the cycle to </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
            >
              <span className="truncate"> {activity.new_value}</span>
            </a>
          </>
        ) : (
          <>
            <span>removed the issue from the cycle </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/cycles/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
            >
              <span className="truncate"> {activity.new_value}</span>
            </a>
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
