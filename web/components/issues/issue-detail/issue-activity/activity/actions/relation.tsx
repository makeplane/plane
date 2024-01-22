import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueActivityBlockComponent } from "./";
// component helpers
import { issueRelationObject } from "components/issues/issue-detail/relation-select";
// types
import { TIssueRelationTypes } from "@plane/types";

type TIssueRelationActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueRelationActivity: FC<TIssueRelationActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={activity.field ? issueRelationObject[activity.field as TIssueRelationTypes].icon(14) : <></>}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.field === "blocking" &&
          (activity.old_value === "" ? `marked this issue is blocking issue ` : `removed the blocking issue `)}
        {activity.field === "blocked_by" &&
          (activity.old_value === ""
            ? `marked this issue is being blocked by `
            : `removed this issue being blocked by issue `)}
        {activity.field === "duplicate" &&
          (activity.old_value === "" ? `marked this issue as duplicate of ` : `removed this issue as a duplicate of `)}
        {activity.field === "relates_to" &&
          (activity.old_value === "" ? `marked that this issue relates to ` : `removed the relation from `)}

        {activity.old_value === "" ? (
          <span className="font-medium text-custom-text-100">{activity.new_value}.</span>
        ) : (
          <span className="font-medium text-custom-text-100">{activity.old_value}.</span>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
