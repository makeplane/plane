import { FC } from "react";
import { observer } from "mobx-react";
import { Triangle } from "lucide-react";
// hooks
import { useEstimate, useIssueDetail } from "hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueEstimateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueEstimateActivity: FC<TIssueEstimateActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { areEstimatesEnabledForCurrentProject, getEstimatePointValue } = useEstimate();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const estimateValue = getEstimatePointValue(Number(activity.new_value), null);
  const currentPoint = Number(activity.new_value) + 1;

  return (
    <IssueActivityBlockComponent
      icon={<Triangle size={14} color="#6b7280" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the estimate point to ` : `removed the estimate point `}
        {activity.new_value && (
          <>

            <span className="font-medium text-custom-text-100">
              {areEstimatesEnabledForCurrentProject
                ? estimateValue
                : `${currentPoint} ${currentPoint > 1 ? "points" : "point"}`}
            </span>

          </>
        )}
        {showIssue && (activity.new_value ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
