import { FC } from "react";
import { observer } from "mobx-react";
import { Paperclip } from "lucide-react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueAttachmentActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueAttachmentActivity: FC<TIssueAttachmentActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<Paperclip size={14} color="#6b7280" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? `uploaded a new ` : `removed an attachment`}
        {activity.verb === "created" && (
          <a
            href={`${activity.new_value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
          >
            attachment
          </a>
        )}
        {showIssue && (activity.verb === "created" ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
