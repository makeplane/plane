// plane package imports
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import type { IInsightField } from "@plane/constants";
import { ANALYTICS_INSIGHTS_FIELDS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IAnalyticsResponse, TAnalyticsTabsBase } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// local imports
import InsightCard from "./insight-card";

const analyticsService = new AnalyticsService();

const getInsightLabel = (
  analyticsType: TAnalyticsTabsBase,
  item: IInsightField,
  isEpic: boolean | undefined,
  t: (key: string, params?: Record<string, unknown>) => string
) => {
  if (analyticsType === "work-items") {
    return isEpic
      ? t(item.i18nKey, { entity: t("common.epics") })
      : t(item.i18nKey, { entity: t("common.work_items") });
  }

  // Get the base translation with entity
  const baseTranslation = t(item.i18nKey, {
    ...item.i18nProps,
    entity: item.i18nProps?.entity && t(item.i18nProps?.entity),
  });

  // Add prefix if available
  const prefix = item.i18nProps?.prefix ? `${t(item.i18nProps.prefix)} ` : "";

  // Add suffix if available
  const suffix = item.i18nProps?.suffix ? ` ${t(item.i18nProps.suffix)}` : "";

  // Combine prefix, base translation, and suffix
  return `${prefix}${baseTranslation}${suffix}`;
};

const TotalInsights = observer(function TotalInsights({
  analyticsType,
  peekView,
}: {
  analyticsType: TAnalyticsTabsBase;
  peekView?: boolean;
}) {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView, isEpic } = useAnalytics();
  const { data: totalInsightsData, isLoading } = useSWR(
    `total-insights-${analyticsType}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isEpic}`,
    () =>
      analyticsService.getAdvanceAnalytics<IAnalyticsResponse>(
        workspaceSlug,
        analyticsType,
        {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
          ...(isEpic ? { epic: true } : {}),
        },
        isPeekView
      )
  );
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10",
        !peekView
          ? ANALYTICS_INSIGHTS_FIELDS[analyticsType]?.length % 5 === 0
            ? "gap-10 lg:grid-cols-5"
            : "gap-8 lg:grid-cols-4"
          : "grid-cols-2"
      )}
    >
      {ANALYTICS_INSIGHTS_FIELDS[analyticsType]?.map((item) => (
        <InsightCard
          key={`${analyticsType}-${item.key}`}
          isLoading={isLoading}
          data={totalInsightsData?.[item.key]}
          label={getInsightLabel(analyticsType, item, isEpic, t)}
        />
      ))}
    </div>
  );
});

export default TotalInsights;
