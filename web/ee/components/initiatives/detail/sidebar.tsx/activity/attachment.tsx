import { FC } from "react";
import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
//
import { InitiativeActivityBlockComponent } from "./common";

type TTInitiativeAttachmentActivity = { activity: TInitiativeActivity; ends: "top" | "bottom" | undefined };

export const TInitiativeAttachmentActivity: FC<TTInitiativeAttachmentActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <InitiativeActivityBlockComponent
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
      </>
    </InitiativeActivityBlockComponent>
  );
});
