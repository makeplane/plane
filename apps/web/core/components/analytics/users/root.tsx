/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";

// Plane  imports

import type { UserInsightColumns } from "@plane/types";

// Local imports

import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useMember } from "@/hooks/store/use-member";
import { AnalyticsService } from "@/services/analytics.service";
import UsersInsightTable from "./user-insight-table";
import WiResolvedVsPending from "./wi-resolved-vs-pending";

const analyticsService = new AnalyticsService();

const Users = observer(function Users() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();

  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();

  const {
    workspace: { isUserSuspended },
  } = useMember();

  const { data: tableData, isLoading: isTableLoading } = useSWR(
    `insights-table-users-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<UserInsightColumns[]>(
        workspaceSlug,
        "users",
        {
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );

  // Sort data to keep suspended users at the bottom
  const sortedTableData = useMemo(() => {
    if (!tableData) return tableData;

    return [...tableData].sort((a, b) => {
      const aIsSuspended = isUserSuspended(a.user_id, workspaceSlug);
      const bIsSuspended = isUserSuspended(b.user_id, workspaceSlug);

      // If one is suspended and the other isn't, suspended goes to bottom
      if (aIsSuspended && !bIsSuspended) return 1;
      if (!aIsSuspended && bIsSuspended) return -1;

      // If both have the same suspension status, maintain original order
      return 0;
    });
  }, [tableData, isUserSuspended, workspaceSlug]);

  return (
    <AnalyticsWrapper i18nTitle="common.users">
      <div className="flex flex-col gap-14">
        <TotalInsights analyticsType="users" />
        <WiResolvedVsPending
          data={sortedTableData}
          isLoading={isTableLoading}
          selectedDurationLabel={selectedDurationLabel || ""}
        />
        <UsersInsightTable data={sortedTableData} isLoading={isTableLoading} />
      </div>
    </AnalyticsWrapper>
  );
});

export { Users };
