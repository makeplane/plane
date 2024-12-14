import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";

// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectNameActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectNameActivity: FC<TProjectNameActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.new_value ? `updated the name to ${activity.new_value}` : `removed the name`}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
