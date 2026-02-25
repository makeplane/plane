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

const IntakeDistribution = observer(function IntakeDistribution() {
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

    const { data: intakeDistributionData, isLoading } = useSWR(
        `intake-distribution-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
        () =>
            analyticsService.getAdvanceAnalyticsCharts<any>(
                workspaceSlug,
                "intake",
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
        if (!intakeDistributionData?.data) return [];
        return intakeDistributionData.data;
    }, [intakeDistributionData]);

    const bars: any[] = useMemo(
        () => [
            {
                key: "accepted_issues",
                label: t("workspace_analytics.status.accepted"),
                fill: "#198038",
                activeBarFill: "#24A148",
                textClassName: "text-[#198038]",
                stackId: "bar-one",
            },
            {
                key: "declined_issues",
                label: t("workspace_analytics.status.declined"),
                fill: "#da1e28",
                activeBarFill: "#fa4d56",
                textClassName: "text-[#da1e28]",
                stackId: "bar-one",
            },
        ],
        [t]
    );

    return (
        <AnalyticsSectionWrapper
            title={t("workspace_analytics.tabs.intake_trends")}
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
                        label: t("date"),
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

export default IntakeDistribution;
