import { FC } from "react";
import { observer } from "mobx-react";
import { CalendarDays } from "lucide-react";
// hooks
import { renderFormattedDate } from "@/helpers/date-time.helper";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";
// helpers

type TProjectStartDateActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectStartDateActivity: FC<TProjectStartDateActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<CalendarDays size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the start date to ` : `removed the start date `}
        {activity.new_value && (
          <>
            <span className="font-medium text-custom-text-100">{renderFormattedDate(activity.new_value)}</span>
          </>
        )}
        {showProject && (activity.new_value ? ` for ` : ` from `)}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
