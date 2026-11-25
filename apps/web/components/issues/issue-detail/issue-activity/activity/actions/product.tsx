/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { CubeOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { formatStoredTime } from "@/components/meetings/time";
import { useReaderTimezone } from "@/components/meetings/use-reader-timezone";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./";

const MEETING_FIELDS = new Set(["participants", "meeting_time", "location", "organizer", "outcome"]);

type Props = { activityId: string; ends: "top" | "bottom" | undefined };

/** Changes of the kind and of the product fields. */
export const IssueProductActivity = observer(function IssueProductActivity(props: Props) {
  const { activityId, ends } = props;
  const { t, currentLocale } = useTranslation();
  const timeZone = useReaderTimezone();
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const activity = getActivityById(activityId);
  if (!activity?.field) return <></>;

  const format = (value: string | null | undefined) => {
    if (!value) return "—";
    if (activity.field === "kind") return t(`product.kinds.${value}`);
    if (activity.field === "meeting_time") return formatStoredTime(value, timeZone, currentLocale);
    return activity.field === "manual_progress" ? `${value}%` : value;
  };

  return (
    <IssueActivityBlockComponent
      icon={<CubeOutline className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />}
      activityId={activityId}
      ends={ends}
    >
      <>
        {t(`${MEETING_FIELDS.has(activity.field) ? "meeting" : "product"}.history.${activity.field}`)}
        {activity.field !== "outcome" && (
          <>
            : {format(activity.old_value)} →{" "}
            <span className="font-medium text-primary">{format(activity.new_value)}</span>
          </>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
