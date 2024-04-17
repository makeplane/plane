import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { Inbox } from "lucide-react";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent } from "./";
// icons

type TIssueInboxActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueInboxActivity: FC<TIssueInboxActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  const getInboxActivityMessage = () => {
    switch (activity?.verb) {
      case "-1":
        return "declined this issue from inbox.";
      case "0":
        return "snoozed this issue.";
      case "1":
        return "accepted this issue from inbox.";
      case "2":
        return "declined this issue from inbox by marking a duplicate issue.";
      default:
        return "updated inbox issue status.";
    }
  };

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent icon={<Inbox className="h-4 w-4 flex-shrink-0" />} activityId={activityId} ends={ends}>
      <>{getInboxActivityMessage()}</>
    </IssueActivityBlockComponent>
  );
});
