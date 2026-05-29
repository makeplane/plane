import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// Plane-web
import { getRelationActivityContent, useTimeLineRelationOptions } from "@/plane-web/components/relations";
import type { TIssueRelationTypes } from "@/plane-web/types";
//
import { IssueActivityBlockComponent } from "./";

type TIssueRelationActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueRelationActivity = observer(function IssueRelationActivity(props: TIssueRelationActivity) {
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
        <span className="font-medium text-primary">{activity.new_value}.</span>
      ) : (
        <span className="font-medium text-primary">{activity.old_value}.</span>
      )}
    </IssueActivityBlockComponent>
  );
});
