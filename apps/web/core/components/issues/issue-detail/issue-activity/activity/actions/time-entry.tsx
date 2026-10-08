/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { formatTimeDuration } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
// components
import { IssueActivityBlockComponent } from "./";

type TIssueTimeEntryActivity = { activityId: string; ends: "top" | "bottom" | undefined };

const seconds = (value: string | undefined) => formatTimeDuration(value ? Number(value) : 0);

/** "logged 1h 30m", "changed logged time from 1h to 2h", "removed 45m of logged time" (+ "for {owner}"). */
export const IssueTimeEntryActivity = observer(function IssueTimeEntryActivity(props: TIssueTimeEntryActivity) {
  const { activityId, ends } = props;
  const { t } = useTranslation();
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  // old_identifier holds the entry's owner; it differs from the actor when an admin logged on someone's behalf
  const owner =
    activity.old_identifier && activity.old_identifier !== activity.actor
      ? getUserDetails(activity.old_identifier)
      : undefined;

  const message =
    activity.verb === "created"
      ? t("time-tracking.activity.logged", { duration: seconds(activity.new_value) })
      : activity.verb === "updated"
        ? t("time-tracking.activity.changed", { old: seconds(activity.old_value), new: seconds(activity.new_value) })
        : t("time-tracking.activity.removed", { duration: seconds(activity.old_value) });

  return (
    <IssueActivityBlockComponent
      icon={<Timer size={14} className="text-secondary" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        <span>{message}</span>
        {owner && (
          <>
            {" "}
            <span className="font-medium text-primary">
              {t("time-tracking.activity.for_owner", { name: owner.display_name })}
            </span>
          </>
        )}
        .
      </>
    </IssueActivityBlockComponent>
  );
});
