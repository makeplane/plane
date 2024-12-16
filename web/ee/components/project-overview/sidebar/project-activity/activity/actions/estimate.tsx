import { FC } from "react";
import { observer } from "mobx-react";
import { Triangle } from "lucide-react";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectEstimateActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectEstimateActivity: FC<TProjectEstimateActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  return (
    <ProjectActivityBlockComponent
      icon={<Triangle size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the estimate point to ` : `removed the estimate point `}
        {activity.new_value ? activity.new_value : activity?.old_value || ""}
        {showProject && (activity.new_value ? ` to ` : ` from `)}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
