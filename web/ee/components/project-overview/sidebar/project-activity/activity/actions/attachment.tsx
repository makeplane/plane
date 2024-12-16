import { FC } from "react";
import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectAttachmentActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectAttachmentActivity: FC<TProjectAttachmentActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  if (!activity) return <></>;
  return (
    <ProjectActivityBlockComponent
      icon={<Paperclip size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? `uploaded a new ` : `removed an attachment`}
        {activity.verb === "created" && (
          <a
            href={`${activity.new_value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
          >
            attachment
          </a>
        )}
        {showProject && (activity.verb === "created" ? ` to ` : ` from `)}
        {showProject && <ProjectLink activity={activity} />}.
      </>
    </ProjectActivityBlockComponent>
  );
});
