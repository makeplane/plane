/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import { timeReportService } from "@/services/time-report.service";
// local imports
import { getPresetRange } from "./filters";
import { TimeReportFilters } from "./filters";
import { TimesheetGrid } from "./timesheet-grid";
import { buildTimesheetData } from "./transform";
import { exportTimesheetCsv } from "./export-csv";

type Props = {
  workspaceSlug: string;
  projectId?: string;
};

export const TimeReportRoot = observer(function TimeReportRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { joinedProjectIds } = useProject();

  const defaultRange = getPresetRange("this_week");
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);

  const swrKey = [
    "time-report",
    workspaceSlug,
    projectId ?? "workspace",
    startDate,
    endDate,
    userIds.join(","),
    projectIds.join(","),
  ];

  const { data, isLoading, error } = useSWR(swrKey, () => {
    const params = {
      start_date: startDate,
      end_date: endDate,
      user_ids: userIds.length > 0 ? userIds.join(",") : undefined,
      project_ids: !projectId && projectIds.length > 0 ? projectIds.join(",") : undefined,
    };

    return projectId
      ? timeReportService.getProjectTimeReport(workspaceSlug, projectId, params)
      : timeReportService.getWorkspaceTimeReport(workspaceSlug, params);
  });

  const timesheetData = useMemo(() => buildTimesheetData(data), [data]);

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-page-x py-page-y">
      <TimeReportFilters
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        userIds={userIds}
        onUserIdsChange={setUserIds}
        canViewOthers={!!data?.can_view_others}
        onExport={() => exportTimesheetCsv(timesheetData, workspaceSlug, startDate, endDate)}
        exportDisabled={timesheetData.users.length === 0}
        workspaceScope={!projectId}
        projectIds={projectIds}
        onProjectIdsChange={setProjectIds}
        availableProjectIds={joinedProjectIds}
      />

      {error ? (
        <div className="flex h-64 w-full items-center justify-center text-13 text-tertiary">
          {t("time_reports.errors.range_too_long")}
        </div>
      ) : (
        <TimesheetGrid data={timesheetData} isLoading={isLoading} workspaceSlug={workspaceSlug} />
      )}
    </div>
  );
});
