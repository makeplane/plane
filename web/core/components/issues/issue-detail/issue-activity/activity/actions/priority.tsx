import { FC } from "react";
import { observer } from "mobx-react";
import { Signal } from "lucide-react";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
import { useTranslation } from "@plane/i18n";

type TIssuePriorityActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssuePriorityActivity: FC<TIssuePriorityActivity> = observer((props) => {
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
      icon={<Signal size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {t("set_priority_to")} <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        {showIssue ? ` ${t("for")} ` : ``}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
