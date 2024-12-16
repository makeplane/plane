"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { DoubleCircleIcon } from "@plane/ui";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";
// icons

type TProjectStateActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectStateActivity: FC<TProjectStateActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<DoubleCircleIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activity={activity}
      ends={ends}
    >
      <>
        set the state to <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        {showProject ? ` for ` : ``}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
