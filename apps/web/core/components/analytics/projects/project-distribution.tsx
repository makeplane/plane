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

const ProjectDistribution = observer(function ProjectDistribution() {
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

    const { data: projectDistributionData, isLoading } = useSWR(
        `project-distribution-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
        () =>
            analyticsService.getAdvanceAnalyticsCharts<any>(
                workspaceSlug,
                "projects",
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
        if (!projectDistributionData) return [];
        return projectDistributionData.map((datum: any) => ({
            ...datum,
            [datum.name]: datum.count,
        }));
    }, [projectDistributionData]);

    const bars: any[] = useMemo(
        () => [
            {
                key: "count",
                label: t("workspace_analytics.project_insights"),
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
            title={t("workspace_analytics.tabs.projects_by_status")}
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
                        label: t("common.metrics"),
                    }}
                    yAxis={{
                        key: "count",
                        label: t("common.count"),
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
                    title={t("workspace_analytics.empty_state.project_insights.title")}
                />
            )}
        </AnalyticsSectionWrapper>
    );
});

export default ProjectDistribution;
