import { FC } from "react";
import { observer } from "mobx-react";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";

type TInitiativeActivityItem = {
  workspaceSlug: string;
  activity: TInitiativeActivity;
};

export const InitiativeActivityItem: FC<TInitiativeActivityItem> = observer((props) => {
  const { workspaceSlug, activity } = props;

  const activityField = activity?.field;

  switch (activityField) {
    case "initiative":
      return <>{activity.verb === "created" ? " created the initiative." : " deleted an initiative."}</>;
    case "name":
      return <>set the name to {activity.new_value}.</>;
    case "description":
      return <>updated the description</>;
    case "lead":
      return (
        <>
          {activity.old_value === "" ? `added a new assignee ` : `removed the assignee `}
          <a
            href={`/${workspaceSlug}/profile/${activity.new_identifier ?? activity.old_identifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center font-medium text-custom-text-100 hover:underline capitalize"
          >
            {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
          </a>
        </>
      );
    case "start_date":
      return (
        <>
          {activity.new_value ? `set the start date to ` : `removed the start date `}
          {activity.new_value && (
            <>
              <span className="font-medium text-custom-text-100">{renderFormattedDate(activity.new_value)}</span>
            </>
          )}
        </>
      );
    case "end_date":
      return (
        <>
          {activity.new_value ? `set the due date to ` : `removed the due date `}
          {activity.new_value && (
            <>
              <span className="font-medium text-custom-text-100">{renderFormattedDate(activity.new_value)}</span>
            </>
          )}
          .
        </>
      );
    case "link":
      return (
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
        </>
      );
    case "attachment":
      return (
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
        </>
      );
    default:
      return <></>;
  }
});
