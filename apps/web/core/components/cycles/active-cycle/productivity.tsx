import type { FC } from "react";
import { Fragment } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { ICycle, TCycleEstimateType } from "@plane/types";
import { Loader } from "@plane/ui";
// assets
import darkChartAsset from "@/app/assets/empty-state/active-cycle/chart-dark.webp?url";
import lightChartAsset from "@/app/assets/empty-state/active-cycle/chart-light.webp?url";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { EstimateTypeDropdown } from "../dropdowns/estimate-type-dropdown";

export type ActiveCycleProductivityProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle | null;
};

export const ActiveCycleProductivity = observer(function ActiveCycleProductivity(props: ActiveCycleProductivityProps) {
  const { workspaceSlug, projectId, cycle } = props;
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { getEstimateTypeByCycleId, setEstimateType } = useCycle();
  // derived values
  const estimateType: TCycleEstimateType = (cycle && getEstimateTypeByCycleId(cycle.id)) || "issues";
  const resolvedPath = resolvedTheme === "light" ? lightChartAsset : darkChartAsset;

  const onChange = async (value: TCycleEstimateType) => {
    if (!workspaceSlug || !projectId || !cycle || !cycle.id) return;
    setEstimateType(cycle.id, value);
  };

  const chartDistributionData =
    cycle && estimateType === "points" ? cycle?.estimate_distribution : cycle?.distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  return cycle && completionChartDistributionData ? (
    <div className="flex flex-col min-h-[17rem] gap-5 px-3.5 py-4 bg-surface-1 border border-subtle rounded-lg">
      <div className="relative flex items-center justify-between gap-4">
        <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle?.id}`}>
          <h3 className="text-14 text-tertiary font-semibold">{t("project_cycles.active_cycle.issue_burndown")}</h3>
        </Link>
        <EstimateTypeDropdown value={estimateType} onChange={onChange} cycleId={cycle.id} projectId={projectId} />
      </div>

      <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle?.id}`}>
        {cycle.total_issues > 0 ? (
          <>
            <div className="h-full w-full px-2">
              <div className="flex items-center justify-end gap-4 py-1 text-11 text-tertiary">
                {estimateType === "points" ? (
                  <span>{`Pending points - ${cycle.backlog_estimate_points + cycle.unstarted_estimate_points + cycle.started_estimate_points}`}</span>
                ) : (
                  <span>{`Pending work items - ${cycle.backlog_issues + cycle.unstarted_issues + cycle.started_issues}`}</span>
                )}
              </div>

              <div className="relative  h-full">
                {completionChartDistributionData && (
                  <Fragment>
                    {estimateType === "points" ? (
                      <ProgressChart
                        distribution={completionChartDistributionData}
                        totalIssues={cycle.total_estimate_points || 0}
                        plotTitle={"points"}
                      />
                    ) : (
                      <ProgressChart
                        distribution={completionChartDistributionData}
                        totalIssues={cycle.total_issues || 0}
                        plotTitle={"work items"}
                      />
                    )}
                  </Fragment>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center h-full w-full">
              <SimpleEmptyState title={t("active_cycle.empty_state.chart.title")} assetPath={resolvedPath} />
            </div>
          </>
        )}
      </Link>
    </div>
  ) : (
    <Loader className="flex flex-col min-h-[17rem] gap-5 bg-surface-1 border border-subtle rounded-lg">
      <Loader.Item width="100%" height="100%" />
    </Loader>
  );
});
