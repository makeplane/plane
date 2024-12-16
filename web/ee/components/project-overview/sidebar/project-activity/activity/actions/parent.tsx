import { FC } from "react";
import { observer } from "mobx-react";
import { LayoutPanelTop } from "lucide-react";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectParentActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectParentActivity: FC<TProjectParentActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<LayoutPanelTop size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the parent to ` : `removed the parent `}
        {activity.new_value ? (
          <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        ) : (
          <span className="font-medium text-custom-text-100">{activity.old_value}</span>
        )}
        {showProject && (activity.new_value ? ` for ` : ` from `)}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
