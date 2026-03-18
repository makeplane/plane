/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PencilLine, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { IssueActivityBlockComponent } from "@/components/issues/issue-detail/issue-activity/activity/actions/helpers/activity-block";

export type TAdditionalActivityRoot = {
  activityId: string;
  showIssue?: boolean;
  ends: "top" | "bottom" | undefined;
  field: string | undefined;
};

export const AdditionalActivityRoot = observer(function AdditionalActivityRoot(props: TAdditionalActivityRoot) {
  const { activityId, ends, field } = props;
  const { t } = useTranslation();
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  // Only render worklog audit trail entries
  if (field !== "worklog") return <></>;

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const isDeleted = activity.verb === "deleted";
  const icon = isDeleted ? (
    <Trash2 className="h-3.5 w-3.5 text-red-500" />
  ) : (
    <PencilLine className="h-3.5 w-3.5 text-secondary" />
  );

  return (
    <IssueActivityBlockComponent activityId={activityId} icon={icon} ends={ends}>
      <span>
        {isDeleted ? t("worklog.activity_deleted_log") : t("worklog.activity_modified")}
        {activity.old_value && <span className="font-medium text-primary"> — {activity.old_value}</span>}
        {activity.new_value && (
          <>
            <br />
            <span className="text-tertiary ml-0.5">
              {t("worklog.activity_reason")}: &quot;{activity.new_value}&quot;
            </span>
          </>
        )}
      </span>
    </IssueActivityBlockComponent>
  );
});
