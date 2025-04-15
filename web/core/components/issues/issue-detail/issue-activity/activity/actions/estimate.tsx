import { FC } from "react";
import { observer } from "mobx-react";
import { Triangle } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueEstimateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueEstimateActivity: FC<TIssueEstimateActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  return (
    <IssueActivityBlockComponent
      icon={<Triangle size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the estimate point to ` : `removed the estimate point`}
        {activity.new_value ? activity.new_value : activity?.old_value}
        {showIssue && (activity.new_value ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
