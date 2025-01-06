import { FC } from "react";
import { observer } from "mobx-react";
import { CalendarDays } from "lucide-react";
// hooks
import { renderFormattedDate } from "@/helpers/date-time.helper";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
//
import { InitiativeActivityBlockComponent } from "./common";

type TInitiativeStartDateActivity = { activity: TInitiativeActivity; ends: "top" | "bottom" | undefined };

export const InitiativeStartDateActivity: FC<TInitiativeStartDateActivity> = observer((props) => {
  const { activity, ends } = props;

  if (!activity) return <></>;
  return (
    <InitiativeActivityBlockComponent
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
      </>
    </InitiativeActivityBlockComponent>
  );
});
