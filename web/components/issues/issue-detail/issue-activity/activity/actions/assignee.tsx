import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
// icons
import { UserGroupIcon } from "@plane/ui";

type TIssueAssigneeActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueAssigneeActivity: FC<TIssueAssigneeActivity> = observer((props) => {
  const { activityId, ends, showIssue = true } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<UserGroupIcon className="h-4 w-4 flex-shrink-0" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.old_value === "" ? `added a new assignee ` : `removed the assignee `}

        <a
          href={`/${activity.workspace_detail?.slug}/profile/${activity.new_identifier ?? activity.old_identifier}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center font-medium text-custom-text-100 hover:underline capitalize"
        >
          {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
        </a>

        {showIssue && (activity.old_value === "" ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
