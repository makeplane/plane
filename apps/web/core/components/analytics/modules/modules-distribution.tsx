import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { BarChart } from "@plane/propel/charts/bar-chart";
import { EmptyStateCompact } from "@plane/propel/empty-state";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ChartLoader } from "../loaders";

const analyticsService = new AnalyticsService();

const ModulesDistribution = observer(function ModulesDistribution() {
    const {
        selectedDuration,
        selectedDurationLabel,
        selectedProjects,
        selectedCycle,
        selectedModule,
        isPeekView,
        isEpic,
    } = useAnalytics();
    const params = useParams();
    const { t } = useTranslation();
    const workspaceSlug = params.workspaceSlug.toString();

    const { data: modulesDistributionData, isLoading } = useSWR(
        `modules-distribution-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
        () =>
            analyticsService.getAdvanceAnalyticsCharts<any>(
                workspaceSlug,
                "modules",
                {
                    ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
                    ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
                    ...(selectedModule ? { module_id: selectedModule } : {}),
                    ...(isEpic ? { epic: true } : {}),
                },
                isPeekView
            )
    );

    const parsedData = useMemo(() => {
        if (!modulesDistributionData?.data) return [];
        return modulesDistributionData.data.map((datum: any) => ({
            ...datum,
            pending_issues: datum.total_issues - datum.completed_issues,
        }));
    }, [modulesDistributionData]);

    const bars: any[] = useMemo(
        () => [
            {
                key: "completed_issues",
                label: t("workspace_analytics.completed"),
                fill: "#198038",
                activeBarFill: "#24A148",
                textClassName: "text-[#198038]",
                stackId: "bar-one",
            },
            {
                key: "pending_issues",
                label: t("workspace_analytics.pending"),
                fill: "#1192E8",
                activeBarFill: "#0f62fe",
                textClassName: "text-[#1192E8]",
                stackId: "bar-one",
            },
        ],
        [t]
    );

    return (
        <AnalyticsSectionWrapper
            title={t("workspace_analytics.tabs.module_progress")}
            subtitle={selectedDurationLabel}
            className="col-span-1"
        >
            {isLoading ? (
                <ChartLoader />
            ) : parsedData && parsedData.length > 0 ? (
                <BarChart
                    className="h-[350px] w-full"
                    data={parsedData}
                    bars={bars}
                    xAxis={{
                        key: "name",
                        label: t("common.module"),
                    }}
                    yAxis={{
                        key: "count",
                        label: t("common.work_items"),
                        offset: -60,
                        dx: -24,
                    }}
                    showTooltip={true}
                    barSize={40}
                />
            ) : (
                <EmptyStateCompact
                    assetKey="unknown"
                    assetClassName="size-20"
                    rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
                    title={t("workspace_analytics.empty_state.general.title")}
                />
            )}
        </AnalyticsSectionWrapper>
    );
});

export default ModulesDistribution;
