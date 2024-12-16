import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { Intake } from "@plane/ui";

// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";
// icons

type TProjectInboxActivity = { activity: any; ends: "top" | "bottom" | undefined };

export const ProjectInboxActivity: FC<TProjectInboxActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<Intake className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.new_value ? `declined this project from intake.` : `snoozed this project.`}
        {activity.new_value
          ? `accepted this project from intake.`
          : `declined this project from intake by marking a duplicate project.`}
        {activity.new_value ? `updated intake project status.` : ``}
        <ProjectLink activity={activity} />.
      </>
    </ProjectActivityBlockComponent>
  );
});
