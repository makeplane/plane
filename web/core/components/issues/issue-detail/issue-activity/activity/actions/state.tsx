"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { DoubleCircleIcon } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent, IssueLink } from "./";
// icons
import { useTranslation } from "@plane/i18n";

type TIssueStateActivity = { activityId: string; showIssue?: boolean; ends: "top" | "bottom" | undefined };

export const IssueStateActivity: FC<TIssueStateActivity> = observer((props) => {
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
      icon={<DoubleCircleIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {t("set_state_to")} <span className="font-medium text-custom-text-100">{activity.new_value}</span>
        {showIssue ? ` ${t("for")} ` : ``}
        {showIssue && <IssueLink activityId={activityId} />}.
      </>
    </IssueActivityBlockComponent>
  );
});
