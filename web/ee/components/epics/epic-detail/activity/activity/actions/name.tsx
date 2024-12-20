import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
import { EIssueServiceType } from "@plane/constants";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent } from ".";

type TIssueNameActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueNameActivity: FC<TIssueNameActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail(EIssueServiceType.EPICS);

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>set the name to {activity.new_value}.</>
    </IssueActivityBlockComponent>
  );
});
