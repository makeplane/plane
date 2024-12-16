"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { LayersIcon } from "@plane/ui";
// components
import { ProjectActivityBlockComponent } from ".";
// icons

type TProjectDefaultActivity = { activity: any; ends: "top" | "bottom" | undefined };

export const ProjectDefaultActivity: FC<TProjectDefaultActivity> = observer((props) => {
  const { activity, ends } = props;

  return (
    <ProjectActivityBlockComponent
      icon={<LayersIcon width={14} height={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>{activity.verb === "created" ? " created the project." : " deleted a project."}</>
    </ProjectActivityBlockComponent>
  );
});
