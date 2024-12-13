import { FC } from "react";
import { observer } from "mobx-react";
import { Tag } from "lucide-react";
// hooks
import { LabelActivityChip } from "@/components/issues/issue-detail/issue-activity/activity/actions";
import { useLabel } from "@/hooks/store";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectLabelActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectLabelActivity: FC<TProjectLabelActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;
  // hooks
  const { projectLabels } = useLabel();

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<Tag size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.old_value === "" ? `added a new label ` : `removed the label `}
        <LabelActivityChip
          name={activity.old_value === "" ? activity.new_value : activity.old_value}
          color={
            activity.old_value === ""
              ? projectLabels?.find((l) => l.id === activity.new_identifier)?.color
              : projectLabels?.find((l) => l.id === activity.old_identifier)?.color
          }
        />
        {showProject && (activity.old_value === "" ? ` to ` : ` from `)}
        {showProject && <ProjectLink activity={activity} />}
      </>
    </ProjectActivityBlockComponent>
  );
});
