import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// types
import { TIssuesByPriorityWidgetFilters, TIssuesByPriorityWidgetResponse } from "@plane/types";
// components
import { Card } from "@plane/ui";
import {
  DurationFilterDropdown,
  IssuesByPriorityEmptyState,
  WidgetLoader,
  WidgetProps,
} from "@/components/dashboard/widgets";
import { IssuesByPriorityGraph } from "@/components/graphs";
// constants
import { EDurationFilters } from "@/constants/dashboard";
// helpers
import { getCustomDates } from "@/helpers/dashboard.helper";
// hooks
import { useDashboard } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

const WIDGET_KEY = "issues_by_priority";

export const IssuesByPriorityWidget: React.FC<WidgetProps> = observer((props) => {
  const { dashboardId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { fetchWidgetStats, getWidgetDetails, getWidgetStats, updateDashboardWidgetFilters } = useDashboard();
  // derived values
  const widgetDetails = getWidgetDetails(workspaceSlug, dashboardId, WIDGET_KEY);
  const widgetStats = getWidgetStats<TIssuesByPriorityWidgetResponse[]>(workspaceSlug, dashboardId, WIDGET_KEY);
  const selectedDuration = widgetDetails?.widget_filters.duration ?? EDurationFilters.NONE;
  const selectedCustomDates = widgetDetails?.widget_filters.custom_dates ?? [];

  const handleUpdateFilters = async (filters: Partial<TIssuesByPriorityWidgetFilters>) => {
    if (!widgetDetails) return;

    await updateDashboardWidgetFilters(workspaceSlug, dashboardId, widgetDetails.id, {
      widgetKey: WIDGET_KEY,
      filters,
    });

    const filterDates = getCustomDates(
      filters.duration ?? selectedDuration,
      filters.custom_dates ?? selectedCustomDates
    );
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    });
  };

  useEffect(() => {
    const filterDates = getCustomDates(selectedDuration, selectedCustomDates);
    fetchWidgetStats(workspaceSlug, dashboardId, {
      widget_key: WIDGET_KEY,
      ...(filterDates.trim() !== "" ? { target_date: filterDates } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!widgetDetails || !widgetStats) return <WidgetLoader widgetKey={WIDGET_KEY} />;

  const totalCount = widgetStats.reduce((acc, item) => acc + item?.count, 0);
  const chartData = widgetStats.map((item) => ({
    priority: item?.priority,
    priority_count: item?.count,
  }));

  return (
    <Card>
      <div className="flex items-center justify-between gap-2 mb-4">
        <Link
          href={`/${workspaceSlug}/workspace-views/assigned`}
          className="text-lg font-semibold text-custom-text-300 hover:underline"
        >
          Assigned by priority
        </Link>
        <DurationFilterDropdown
          customDates={selectedCustomDates}
          value={selectedDuration}
          onChange={(val, customDates) =>
            handleUpdateFilters({
              duration: val,
              ...(val === "custom" ? { custom_dates: customDates } : {}),
            })
          }
        />
      </div>
      {totalCount > 0 ? (
        <div className="flex h-full items-center">
          <div className="-mt-[11px] w-full">
            <IssuesByPriorityGraph
              data={chartData}
              onBarClick={(datum) => {
                router.push(
                  `/${workspaceSlug}/workspace-views/assigned?priority=${`${datum.data.priority}`.toLowerCase()}`
                );
              }}
            />
          </div>
        </div>
      ) : (
        <div className="grid h-full place-items-center">
          <IssuesByPriorityEmptyState />
        </div>
      )}
    </Card>
  );
});
