import { FC } from "react";
import { observer } from "mobx-react";
import { CalendarDays } from "lucide-react";
// hooks
import { renderFormattedDate } from "@/helpers/date-time.helper";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
// helpers
import { useTranslation } from "@plane/i18n";

type TIssueStartDateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueStartDateActivity: FC<TIssueStartDateActivity> = observer((props) => {
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
      icon={<CalendarDays size={14} className="text-custom-text-200" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {activity.new_value ? `${t("set_start_date_to")} ` : `${t("removed_start_date")} `}
        {activity.new_value && (
          <>
            <span className="font-medium text-custom-text-100">{renderFormattedDate(activity.new_value)}</span>
          </>
        )}
        {showIssue && (activity.new_value ? ` ${t("for")} ` : ` ${t("from")} `)}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
