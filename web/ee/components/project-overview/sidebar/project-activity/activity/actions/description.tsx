import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectDescriptionActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectDescriptionActivity: FC<TProjectDescriptionActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {showProject ? `described the project as ${activity.new_value}` : `removed the description of the project`}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
