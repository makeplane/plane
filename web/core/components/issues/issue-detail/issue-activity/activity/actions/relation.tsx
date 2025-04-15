import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// Plane-web
import { ISSUE_RELATION_OPTIONS } from "@/plane-web/components/relations";
import { TIssueRelationTypes } from "@/plane-web/types";
//
import { IssueActivityBlockComponent } from "./";
import { useTranslation } from "@plane/i18n";

type TIssueRelationActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueRelationActivity: FC<TIssueRelationActivity> = observer((props) => {
  const { activityId, ends } = props;
  const { t } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={activity.field ? ISSUE_RELATION_OPTIONS[activity.field as TIssueRelationTypes].icon(14) : <></>}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.field === "blocking" &&
          (activity.old_value === "" ? `${t("marked_blocking_issue")} ` : `${t("removed_blocking_issue")} `)}
        {activity.field === "blocked_by" &&
          (activity.old_value === ""
            ? `${t("marked_blocked_by")} `
            : `${t("removed_blocked_by")} `)}
        {activity.field === "duplicate" &&
          (activity.old_value === "" ? `${t("marked_duplicate_of")} ` : `r${t("removed_duplicate_of")} `)}
        {activity.field === "relates_to" &&
          (activity.old_value === "" ? `${t("marked_relation_to")} ` : `${t("removed_relation_from")} `)}

        {activity.old_value === "" ? (
          <span className="font-medium text-custom-text-100">{activity.new_value}.</span>
        ) : (
          <span className="font-medium text-custom-text-100">{activity.old_value}.</span>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
