import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// Plane-web
import { getRelationActivityContent, useTimeLineRelationOptions } from "@/plane-web/components/relations";
import { TIssueRelationTypes } from "@/plane-web/types";
//
import { IssueActivityBlockComponent } from "./";

type TIssueRelationActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueRelationActivity: FC<TIssueRelationActivity> = observer((props) => {
  const { activityId, ends } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  const activityContent = getRelationActivityContent(activity);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={activity.field ? ISSUE_RELATION_OPTIONS[activity.field as TIssueRelationTypes]?.icon(14) : <></>}
      activityId={activityId}
      ends={ends}
    >
      {activityContent}
      {activity.old_value === "" ? (
        <span className="font-medium text-custom-text-100">{activity.new_value}.</span>
      ) : (
        <span className="font-medium text-custom-text-100">{activity.old_value}.</span>
      )}
    </IssueActivityBlockComponent>
  );
});
