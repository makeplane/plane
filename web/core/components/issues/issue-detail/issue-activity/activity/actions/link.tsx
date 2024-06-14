import { FC } from "react";
import { observer } from "mobx-react";
import { MessageSquare } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueLinkActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueLinkActivity: FC<TIssueLinkActivity> = observer((props) => {
  const { activityId, showIssue = false, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<MessageSquare size={14} color="#6b7280" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          <>
            <span>added this </span>
            <a
              href={`${activity.new_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
          </>
        ) : activity.verb === "updated" ? (
          <>
            <span>updated the </span>
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
          </>
        ) : (
          <>
            <span>removed this </span>
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
          </>
        )}
        {showIssue && (activity.verb === "created" ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
