"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
// components
import { DiceIcon } from "@plane/ui";
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectModuleActivity = { activity: any; ends: "top" | "bottom" | undefined };

export const ProjectModuleActivity: FC<TProjectModuleActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<DiceIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.new_value ? (
          <>
            <span>added this project to the module </span>
            <ProjectLink activity={activity} />
          </>
        ) : (
          <>
            <span>removed the project from the module </span>
            <ProjectLink activity={activity} />
          </>
        )}
      </>
    </ProjectActivityBlockComponent>
  );
});
