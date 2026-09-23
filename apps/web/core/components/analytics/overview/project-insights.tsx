/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { lazy, Suspense } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import AnalyticsSectionWrapper from "../analytics-section-wrapper";
import { ProjectInsightsLoader } from "../loaders";

const RadarChart = lazy(function RadarChart() {
  return import("@plane/propel/charts/radar-chart").then((mod) => ({
    default: mod.RadarChart,
  }));
});

const analyticsService = new AnalyticsService();

type TProjectInsightDatum = {
  key: string;
  name: string;
  count: number;
};

const PROJECT_INSIGHT_LABEL_KEYS: Record<string, string> = {
  work_items: "common.work_items",
  cycles: "common.cycles",
  modules: "common.modules",
  intake: "intake",
  members: "common.members",
  pages: "common.pages",
  views: "common.views",
};

const ProjectInsights = observer(function ProjectInsights() {
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  const { selectedDuration, selectedDurationLabel, selectedProjects, selectedCycle, selectedModule, isPeekView } =
    useAnalytics();

  const { data: projectInsightsData, isLoading: isLoadingProjectInsight } = useSWR(
    `radar-chart-project-insights-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsCharts<TProjectInsightDatum[]>(
        workspaceSlug,
        "projects",
        {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );
  const localizedProjectInsightsData = projectInsightsData?.map((item) => {
    const translationKey = PROJECT_INSIGHT_LABEL_KEYS[String(item.key)];

    return {
      ...item,
      name: translationKey ? t(translationKey) : item.name,
    };
  });

  return (
    <AnalyticsSectionWrapper
      title={`${t("workspace_analytics.project_insights")}`}
      subtitle={selectedDurationLabel}
      className="md:col-span-3"
    >
      {isLoadingProjectInsight ? (
        <ProjectInsightsLoader />
      ) : projectInsightsData && projectInsightsData?.length == 0 ? (
        <EmptyStateCompact
          assetKey="unknown"
          assetClassName="size-20"
          rootClassName="border border-subtle px-5 py-10 md:py-20 md:px-20"
          title={t("workspace_empty_state.analytics_work_items.title")}
        />
      ) : (
        <div className="gap-8 lg:flex">
          {localizedProjectInsightsData && (
            <Suspense fallback={<ProjectInsightsLoader />}>
              <RadarChart
                className="h-[350px] w-full text-accent-primary lg:w-3/5"
                data={localizedProjectInsightsData}
                dataKey="key"
                radars={[
                  {
                    key: "count",
                    name: "Count",
                    fill: "var(--text-color-accent-primary)",
                    stroke: "var(--text-color-accent-primary)",
                    fillOpacity: 0.6,
                    dot: {
                      r: 4,
                      fillOpacity: 1,
                    },
                  },
                ]}
                margin={{ top: 0, right: 40, bottom: 10, left: 40 }}
                showTooltip
                angleAxis={{
                  key: "name",
                }}
              />
            </Suspense>
          )}
          <div className="w-full lg:w-2/5">
            <div className="text-13 text-tertiary">{t("workspace_analytics.summary_of_projects")}</div>
            <div className="mb-3 border-b border-subtle py-2">{t("workspace_analytics.all_projects")}</div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-13 text-tertiary">
                <div>{t("workspace_analytics.trend_on_charts")}</div>
                <div>{t("common.work_items")}</div>
              </div>
              {localizedProjectInsightsData?.map((item) => (
                <div key={item.key} className="flex items-center justify-between text-13 text-primary">
                  <div>{item.name}</div>
                  <div className="flex items-center gap-1">
                    {/* <TrendPiece key={item.key} size='xs' /> */}
                    <div className="text-secondary">{item.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AnalyticsSectionWrapper>
  );
});

export default ProjectInsights;
