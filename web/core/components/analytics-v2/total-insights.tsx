// plane package imports
import { observer } from "mobx-react-lite";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EIssuesStoreType, insightsFields } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IAnalyticsResponseV2, TAnalyticsTabsV2Base } from "@plane/types";
//hooks
import { cn } from "@/helpers/common.helper";
import { useAnalyticsV2 } from "@/hooks/store/use-analytics-v2";
//services
import { AnalyticsV2Service } from "@/services/analytics-v2.service";
// plane web components
import InsightCard from "./insight-card";

const analyticsV2Service = new AnalyticsV2Service();

const TotalInsights: React.FC<{
  analyticsType: TAnalyticsTabsV2Base;
  peekView?: boolean;
}> = observer(({ analyticsType, peekView }) => {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  const {
    selectedDuration,
    selectedProjects,
    selectedDurationLabel,
    selectedCycle,
    selectedModule,
    isPeekView,
    isEpic,
  } = useAnalyticsV2();
  const { data: totalInsightsData, isLoading } = useSWR(
    `total-insights-${analyticsType}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsV2Service.getAdvanceAnalytics<IAnalyticsResponseV2>(
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
          ? insightsFields[analyticsType].length % 5 === 0
            ? "gap-10 lg:grid-cols-5"
            : "gap-8 lg:grid-cols-4"
          : "grid-cols-2"
      )}
    >
      {insightsFields[analyticsType]?.map((item) => (
        <InsightCard
          key={`${analyticsType}-${item.key}`}
          isLoading={isLoading}
          data={totalInsightsData?.[item.key]}
          label={
            analyticsType === "work-items"
              ? isEpic
                ? t(item.i18nKey, { entity: t("common.epics") })
                : t(item.i18nKey, { entity: t("common.work_items") })
              : t(item.i18nKey, {
                  ...item.i18nProps,
                  entity: item.i18nProps?.entity && t(item.i18nProps?.entity),
                })
          }
          versus={selectedDurationLabel}
        />
      ))}
    </div>
  );
});

export default TotalInsights;
