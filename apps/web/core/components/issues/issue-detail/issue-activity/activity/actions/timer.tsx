import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssueActivityBlockComponent } from "./";

type TIssueTimerActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueTimerActivity = observer(function IssueTimerActivity(props: TIssueTimerActivity) {
  const { activityId, ends } = props;
  const { activity: { getActivityById } } = useIssueDetail();
  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  return (
    <IssueActivityBlockComponent
      activityId={activityId}
      icon={<Clock width={14} height={14} className="text-custom-text-300" aria-hidden="true" />}
      ends={ends}
    >
      <span> {activity.comment}</span>
    </IssueActivityBlockComponent>
  );
});
