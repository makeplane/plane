"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { RotateCcw } from "lucide-react";
// hooks
import { ArchiveIcon } from "@plane/ui";

// components
import { ProjectActivityBlockComponent } from ".";
// ui

type TProjectArchivedAtActivity = { activity: any; ends: "top" | "bottom" | undefined };

export const ProjectArchivedAtActivity: FC<TProjectArchivedAtActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;

  return (
    <ProjectActivityBlockComponent
      icon={
        activity.new_value === "restore" ? (
          <RotateCcw className="h-3.5 w-3.5 text-custom-text-200" aria-hidden="true" />
        ) : (
          <ArchiveIcon className="h-3.5 w-3.5 text-custom-text-200" aria-hidden="true" />
        )
      }
      activity={activity}
      ends={ends}
      customUserName={activity.new_value === "archive" ? "Plane" : undefined}
    >
      {activity.new_value === "restore" ? "restored the project" : "archived the project"}.
    </ProjectActivityBlockComponent>
  );
});
