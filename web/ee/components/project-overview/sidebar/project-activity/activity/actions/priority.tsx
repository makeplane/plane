import { FC } from "react";
import { observer } from "mobx-react";
import { Signal } from "lucide-react";
// hooks
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectPriorityActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectPriorityActivity: FC<TProjectPriorityActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<Signal size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        set the priority to <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        {showProject ? ` for project` : ``}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
