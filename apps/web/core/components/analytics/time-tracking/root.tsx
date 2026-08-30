/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { useAnalytics } from "@/hooks/store/use-analytics";
import { WorkspaceTimeLogService } from "@/services/workspace/time-log.service";
import AnalyticsWrapper from "../analytics-wrapper";
import { TotalTrackedHours } from "./total-tracked-hours";
import { TrackedHoursOverTime } from "./tracked-hours-over-time";
import { TrackedByChart } from "./tracked-by-chart";
import { TimeTrackingTable } from "./time-tracking-table";

const workspaceTimeLogService = new WorkspaceTimeLogService();

export const TimeTracking = observer(function TimeTracking() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  const { selectedProjects } = useAnalytics();

  const filters = useMemo(
    () => (selectedProjects && selectedProjects.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
    [selectedProjects]
  );

  const { data, isLoading } = useSWR(
    `time-tracking-analytics-${workspaceSlug}-${selectedProjects}`,
    () => workspaceTimeLogService.getWorkspaceTimeLogAnalytics(workspaceSlug, filters),
    { revalidateOnFocus: false }
  );

  return (
    <AnalyticsWrapper i18nTitle="time_tracking">
      <div className="flex flex-col gap-14">
        <TotalTrackedHours totalMinutes={data?.total_minutes} isLoading={isLoading} />
        <TrackedHoursOverTime byDate={data?.by_date ?? []} isLoading={isLoading} />
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
          <TrackedByChart
            title={t("time_tracking_by_project")}
            data={(data?.by_project ?? []).map((item) => ({
              name: item.project__name,
              total_minutes: item.total_minutes,
            }))}
            isLoading={isLoading}
          />
          <TrackedByChart
            title={t("time_tracking_by_member")}
            data={(data?.by_member ?? []).map((item) => ({
              name: item.logged_by__display_name,
              total_minutes: item.total_minutes,
            }))}
            isLoading={isLoading}
          />
        </div>
        <TimeTrackingTable byProject={data?.by_project ?? []} byMember={data?.by_member ?? []} isLoading={isLoading} />
      </div>
    </AnalyticsWrapper>
  );
});
