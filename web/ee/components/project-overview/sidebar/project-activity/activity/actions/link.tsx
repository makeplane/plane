import { FC } from "react";
import { observer } from "mobx-react";
import { Link } from "lucide-react";
// components
import { ProjectActivityBlockComponent, ProjectLink } from ".";

type TProjectLinkActivity = { activity: any; showProject?: boolean; ends: "top" | "bottom" | undefined };

export const ProjectLinkActivity: FC<TProjectLinkActivity> = observer((props) => {
  const { activity, showProject = true, ends } = props;

  return (
    <ProjectActivityBlockComponent
      icon={<Link size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>added </span>
            <a
              href={`${activity.new_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
          </>
        ) : activity.verb === "updated" ? (
          <>
            <span>updated the </span>
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
          </>
        ) : (
          <>
            <span>removed this </span>
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
          </>
        )}
        {showProject && (activity.verb === "created" ? ` to ` : ` from `)}
        {showProject && <ProjectLink activity={activity} />}
      </>
    </ProjectActivityBlockComponent>
  );
});
