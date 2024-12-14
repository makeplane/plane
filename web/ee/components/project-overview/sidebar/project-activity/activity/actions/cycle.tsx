"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { ContrastIcon } from "@plane/ui";

// components
import { ProjectActivityBlockComponent } from ".";
// icons

type TProjectCycleActivity = { activity: any; ends: "top" | "bottom" | undefined };

export const ProjectCycleActivity: FC<TProjectCycleActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<ContrastIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>added this project to the cycle </span>
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
            <span>removed the project from the cycle </span>
            <a
              href={`/${activity.workspace_detail?.slug}/projects/${activity.project}/cycles/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 truncate font-medium text-custom-text-100 hover:underline"
            >
              <span className="truncate"> {activity.old_value}</span>
            </a>
          </>
        )}
      </>
    </ProjectActivityBlockComponent>
  );
});
