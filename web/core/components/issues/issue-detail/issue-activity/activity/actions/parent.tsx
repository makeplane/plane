import { FC } from "react";
import { observer } from "mobx-react";
import { LayoutPanelTop } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
import { useTranslation } from "@plane/i18n";

type TIssueParentActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueParentActivity: FC<TIssueParentActivity> = observer((props) => {
  const { activityId, showIssue = true, ends } = props;
  const { t } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<LayoutPanelTop size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.new_value ? `${t("set_parent_to")} ` : `${t("removed_parent")} `}
        {activity.new_value ? (
          <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        ) : (
          <span className="font-medium text-custom-text-100">{activity.old_value}</span>
        )}
        {showIssue && (activity.new_value ? ` ${t("for")} ` : ` ${t("from")} `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
