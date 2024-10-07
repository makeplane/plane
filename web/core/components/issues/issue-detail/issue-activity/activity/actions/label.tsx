import { FC } from "react";
import { observer } from "mobx-react";
import { Tag } from "lucide-react";
// hooks
import { useIssueDetail, useLabel } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink, LabelActivityChip } from "./";

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
      icon={<Tag size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.old_value === "" ? `added a new label ` : `removed the label `}
        <LabelActivityChip
          name={activity.old_value === "" ? activity.new_value : activity.old_value}
          color={
            activity.old_value === ""
              ? projectLabels?.find((l) => l.id === activity.new_identifier)?.color
              : projectLabels?.find((l) => l.id === activity.old_identifier)?.color
          }
        />
        {showIssue && (activity.old_value === "" ? ` to ` : ` from `)}
        {showIssue && <IssueLink activityId={activityId} />}
      </>
    </IssueActivityBlockComponent>
  );
});
