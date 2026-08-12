/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CalendarLayoutIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { formatPlannedScheduleDisplay } from "@/components/issues/issue-layouts/calendar/utils";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";

type Props = {
  issue: TIssue;
};

export const IssuePlannedScheduleProperty = observer(function IssuePlannedScheduleProperty(props: Props) {
  const { issue } = props;
  const { t } = useTranslation();
  const storeType = useIssueStoreType();

  if (storeType !== EIssuesStoreType.PROFILE) return null;

  const schedule = formatPlannedScheduleDisplay(issue.planned_at, issue.planned_duration_minutes);

  return (
    <SidebarPropertyListItem icon={CalendarLayoutIcon} label={t("issue.properties.scheduled")}>
      <div className="flex h-7.5 w-full min-w-0 items-center px-2 text-body-xs-regular leading-5">
        {schedule ? (
          <span className="truncate">
            {schedule.dateLabel}
            <span className="text-tertiary">
              {" · "}
              {schedule.timeLabel}
              {schedule.durationLabel ? ` · ${schedule.durationLabel}` : ""}
            </span>
          </span>
        ) : (
          <span className="text-placeholder">{t("issue.layouts.calendar.unscheduled")}</span>
        )}
      </div>
    </SidebarPropertyListItem>
  );
});
