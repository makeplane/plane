import { FC } from "react";
import { observer } from "mobx-react";
import { Triangle } from "lucide-react";
// hooks
import { EEstimateSystem } from "@plane/types/src/enums";
import { convertMinutesToHoursMinutesString } from "@/helpers/date-time.helper";
import { useIssueDetail, useProjectEstimates } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueEstimateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueEstimateActivity: FC<TIssueEstimateActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { currentActiveEstimate } = useProjectEstimates();

  const activity = getActivityById(activityId);

  const renderValue = (value: string) => {
    const isTinmeEstimate = currentActiveEstimate?.type === EEstimateSystem.TIME;
    if (isTinmeEstimate) {
      return convertMinutesToHoursMinutesString(Number(value));
    }
    return value;
  };

  if (!activity) return <></>;

  return (
    <IssueActivityBlockComponent
      icon={<Triangle size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.new_value ? `set the estimate to ` : `removed the estimate `}
        {activity.new_value ? renderValue(activity.new_value) : renderValue(activity?.old_value || "")}
        {showIssue && (activity.new_value ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
