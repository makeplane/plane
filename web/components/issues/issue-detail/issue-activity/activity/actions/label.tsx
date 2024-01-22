import { FC } from "react";
import { observer } from "mobx-react";
import { Tag } from "lucide-react";
// hooks
import { useIssueDetail, useLabel } from "hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";

type TIssueLabelActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueLabelActivity: FC<TIssueLabelActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { projectLabels } = useLabel();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<Tag size={14} color="#6b7280" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.old_value === "" ? `added a new label ` : `removed the label `}
        {activity.old_value === "" ? (
          <span className="inline-flex w-min items-center gap-2 truncate whitespace-nowrap rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: projectLabels?.find((l) => l.id === activity.new_identifier)?.color ?? "#000000",
              }}
              aria-hidden="true"
            />
            <span className="flex-shrink truncate font-medium text-custom-text-100">{activity.new_value}</span>
          </span>
        ) : (
          <span className="inline-flex w-min items-center gap-2 truncate whitespace-nowrap rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{
                backgroundColor: projectLabels?.find((l) => l.id === activity.old_identifier)?.color ?? "#000000",
              }}
              aria-hidden="true"
            />
            <span className="flex-shrink truncate font-medium text-custom-text-100">{activity.old_value}</span>
          </span>
        )}
        {showIssue && (activity.old_value === "" ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}
      </>
    </IssueActivityBlockComponent>
  );
});
