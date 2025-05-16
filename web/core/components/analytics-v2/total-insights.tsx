// plane package imports
import { observer } from "mobx-react-lite";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { insightsFields } from "@plane/constants";
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

const TotalInsights: React.FC<{ analyticsType: TAnalyticsTabsV2Base; peekView?: boolean }> = observer(
  ({ analyticsType, peekView }) => {
    const params = useParams();
    const workspaceSlug = params.workspaceSlug as string;
    const { t } = useTranslation();
    const { selectedDuration, selectedProjects, selectedDurationLabel, selectedCycle, selectedModule } =
      useAnalyticsV2();

    const { data: totalInsightsData, isLoading } = useSWR(
      `total-insights-${analyticsType}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}`,
      () =>
        analyticsV2Service.getAdvanceAnalytics<IAnalyticsResponseV2>(workspaceSlug, analyticsType, {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        })
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
        {insightsFields[analyticsType]?.map((item: string) => (
          <InsightCard
            key={`${analyticsType}-${item}`}
            isLoading={isLoading}
            data={totalInsightsData?.[item]}
            label={t(`workspace_analytics.${item}`)}
            versus={selectedDurationLabel}
          />
        ))}
      </div>
    );
  }
);

export default TotalInsights;
