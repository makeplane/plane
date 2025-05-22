import { FC } from "react";
import { observer } from "mobx-react";
import { CalendarDays } from "lucide-react";
// hooks
import { renderFormattedDate } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
// helpers

type TIssueTargetDateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueTargetDateActivity: FC<TIssueTargetDateActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<CalendarDays size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the due date to ` : `removed the due date `}
        {activity.new_value && (
          <>
            <span className="font-medium text-custom-text-100">{renderFormattedDate(activity.new_value)}</span>
          </>
        )}
        {showIssue && (activity.new_value ? ` for ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
