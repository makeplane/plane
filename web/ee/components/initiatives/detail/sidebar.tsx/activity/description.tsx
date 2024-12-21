import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
//
import { InitiativeActivityBlockComponent } from "./common";

type TInitiativeDescriptionActivity = { activity: TInitiativeActivity; ends: "top" | "bottom" | undefined };

export const InitiativeDescriptionActivity: FC<TInitiativeDescriptionActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <InitiativeActivityBlockComponent
      icon={<MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>updated the description</>
    </InitiativeActivityBlockComponent>
  );
});
