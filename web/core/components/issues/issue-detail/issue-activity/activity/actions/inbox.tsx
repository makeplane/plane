import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { Intake } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent } from "./";
// icons
import { useTranslation } from "@plane/i18n";

type TIssueInboxActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueInboxActivity: FC<TIssueInboxActivity> = observer((props) => {
  const { activityId, ends } = props;
  const { t } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  const getInboxActivityMessage = () => {
    switch (activity?.verb) {
      case "-1":
        return t("declined_issue_from_intake");
      case "0":
        return t("snoozed_issue");
      case "1":
        return t("accepted_issue_from_intake");
      case "2":
        return t("declined_issue_from_intake_duplicate");
      default:
        return t("updated_intake_issue_status");
    }
  };

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<Intake className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activityId={activityId}
      ends={ends}
    >
      <>{getInboxActivityMessage()}</>
    </IssueActivityBlockComponent>
  );
});
