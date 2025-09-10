import React from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";

// Plane  imports

import { UserInsightColumns } from "@plane/types";

// Local imports

import AnalyticsWrapper from "@/components/analytics/analytics-wrapper";
import TotalInsights from "@/components/analytics/total-insights";
import { useAnalytics } from "@/hooks/store/use-analytics";
import { AnalyticsService } from "@/services/analytics.service";
import UsersInsightTable from "./user-insight-table";
import WiResolvedVsPending from "./wi-resolved-vs-pending";

const analyticsService = new AnalyticsService();

const Users: React.FC = () => {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();

  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();

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

  return (
    <AnalyticsWrapper i18nTitle="common.users">
      <div className="flex flex-col gap-14">
        <TotalInsights analyticsType="users" />
        <WiResolvedVsPending
          data={tableData}
          isLoading={isTableLoading}
          selectedDurationLabel={selectedDurationLabel || ""}
        />
        <UsersInsightTable data={tableData} isLoading={isTableLoading} />
      </div>
    </AnalyticsWrapper>
  );
};

export { Users };
