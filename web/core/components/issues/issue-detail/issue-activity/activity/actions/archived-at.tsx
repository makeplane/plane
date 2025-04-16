"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { RotateCcw } from "lucide-react";
// hooks
import { ArchiveIcon } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store";
// components
import { IssueActivityBlockComponent } from "./";
// ui
import { useTranslation } from "@plane/i18n";

type TIssueArchivedAtActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueArchivedAtActivity: FC<TIssueArchivedAtActivity> = observer((props) => {
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
      icon={
        activity.new_value === "restore" ? (
          <RotateCcw className="h-3.5 w-3.5 text-custom-text-200" aria-hidden="true" />
        ) : (
          <ArchiveIcon className="h-3.5 w-3.5 text-custom-text-200" aria-hidden="true" />
        )
      }
      activityId={activityId}
      ends={ends}
      customUserName={activity.new_value === "archive" ? "Plane" : undefined}
    >
      {activity.new_value === "restore" ? t("restored_issue") : t("archived_issue")}.
    </IssueActivityBlockComponent>
  );
});
