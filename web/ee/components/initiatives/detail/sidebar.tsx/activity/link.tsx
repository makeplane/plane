import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
import { InitiativeActivityBlockComponent } from "./common";

type TInitiativeLinkActivity = { activity: TInitiativeActivity; ends: "top" | "bottom" | undefined };

export const InitiativeLinkActivity: FC<TInitiativeLinkActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <InitiativeActivityBlockComponent
      icon={<MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />}
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
      </>
    </InitiativeActivityBlockComponent>
  );
});
