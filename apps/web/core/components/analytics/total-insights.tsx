// plane package imports
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { IInsightField, ANALYTICS_INSIGHTS_FIELDS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IAnalyticsResponse, TAnalyticsTabsBase } from "@plane/types";
import { cn } from "@plane/utils";

/**
 * Local imports
 */
import { useAnalytics } from "@/hooks/store/use-analytics";
import { AnalyticsService } from "@/services/analytics.service";
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

  const baseTranslation = t(item.i18nKey, {
    ...item.i18nProps,
    entity: item.i18nProps?.entity && t(item.i18nProps?.entity),
  });

  const prefix = item.i18nProps?.prefix ? `${t(item.i18nProps.prefix)} ` : "";

  const suffix = item.i18nProps?.suffix ? ` ${t(item.i18nProps.suffix)}` : "";

  return `${prefix}${baseTranslation}${suffix}`;
};

const TotalInsights: React.FC<{
  analyticsType: TAnalyticsTabsBase;
  peekView?: boolean;
}> = observer(({ analyticsType, peekView }) => {
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
