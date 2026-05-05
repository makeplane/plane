/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CalendarCheck, CalendarDays, LayoutGrid, PencilLine, Tag, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { renderFormattedDate } from "@plane/utils";
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

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  // Worklog audit trail
  if (field === "worklog") {
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
  }

  // Due date change with reason
  if (field === "target_date") {
    return (
      <IssueActivityBlockComponent
        activityId={activityId}
        icon={<CalendarDays className="h-3.5 w-3.5 text-secondary" />}
        ends={ends}
      >
        <span>
          {activity.new_value ? t("issue.activity_due_date_set") : t("issue.activity_due_date_removed")}
          {activity.new_value && (
            <span className="font-medium text-primary ml-1">{renderFormattedDate(activity.new_value)}</span>
          )}
          {activity.comment && (
            <>
              <br />
              <span className="text-tertiary ml-0.5">
                {t("issue.activity_reason")}: &quot;{activity.comment}&quot;
              </span>
            </>
          )}
        </span>
      </IssueActivityBlockComponent>
    );
  }

  // Completed date change with reason
  if (field === "completed_at") {
    return (
      <IssueActivityBlockComponent
        activityId={activityId}
        icon={<CalendarCheck className="h-3.5 w-3.5 text-secondary" />}
        ends={ends}
      >
        <span>
          {activity.new_value ? t("issue.activity_completed_at_set") : t("issue.activity_completed_at_removed")}
          {activity.new_value && (
            <span className="font-medium text-primary ml-1">{renderFormattedDate(activity.new_value)}</span>
          )}
          {activity.comment && (
            <>
              <br />
              <span className="text-tertiary ml-0.5">
                {t("issue.activity_reason")}: &quot;{activity.comment}&quot;
              </span>
            </>
          )}
        </span>
      </IssueActivityBlockComponent>
    );
  }

  // Main task category change
  if (field === "main_task_category") {
    return (
      <IssueActivityBlockComponent
        activityId={activityId}
        icon={<LayoutGrid className="h-3.5 w-3.5 text-secondary" />}
        ends={ends}
      >
        <span>
          {activity.new_value ? (
            <>
              set the main category to <span className="font-medium text-primary">{activity.new_value}</span>
            </>
          ) : (
            "removed the main category"
          )}
        </span>
      </IssueActivityBlockComponent>
    );
  }

  // Sub task category change
  if (field === "sub_task_category") {
    return (
      <IssueActivityBlockComponent
        activityId={activityId}
        icon={<Tag className="h-3.5 w-3.5 text-secondary" />}
        ends={ends}
      >
        <span>
          {activity.new_value ? (
            <>
              set the sub category to <span className="font-medium text-primary">{activity.new_value}</span>
            </>
          ) : (
            "removed the sub category"
          )}
        </span>
      </IssueActivityBlockComponent>
    );
  }

  return <></>;
});
