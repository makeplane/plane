import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
//
import { InitiativeActivityBlockComponent } from "./common";

type TInitiativeNameActivity = { activity: TInitiativeActivity; ends: "top" | "bottom" | undefined };

export const InitiativeNameActivity: FC<TInitiativeNameActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <InitiativeActivityBlockComponent
      icon={<MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />}
      activity={activity}
      ends={ends}
    >
      <>set the name to {activity.new_value}.</>
    </InitiativeActivityBlockComponent>
  );
});
