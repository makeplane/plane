import { FC } from "react";
import { observer } from "mobx-react";
// icons
import { Users } from "lucide-react";

// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectAssigneeActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectAssigneeActivity: FC<TProjectAssigneeActivity> = observer((props) => {
  const { activity, ends, showProject = true } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<Users className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.old_value === "" ? `added a new assignee ` : `removed the assignee `}
        <a
          href={`/${activity.workspace_detail?.slug}/profile/${activity.new_identifier ?? activity.old_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center font-medium text-custom-text-100 hover:underline capitalize"
        >
          {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
        </a>
        {showProject && (activity.old_value === "" ? ` to ` : ` from `)}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
