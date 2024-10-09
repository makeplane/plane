import { useCallback } from "react";
import isEqual from "lodash/isEqual";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  IActiveCycle,
  IIssueFilterOptions,
  TCycleDistribution,
  TCycleEstimateDistribution,
  TCycleEstimateType,
  TCyclePlotType,
} from "@plane/types";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useCycle, useIssues } from "@/hooks/store";
import { formatActiveCycle } from "./formatter";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string | null;
  defaultCycle?: IActiveCycle | null;
}

const useCycleDetails = (props: IActiveCycleDetails) => {
  // router
  const router = useRouter();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.CYCLE);
  const {
    fetchActiveCycleAnalytics,
    fetchActiveCycleProgress,
    fetchActiveCycleProgressPro,
    getCycleById,
    getPlotTypeByCycleId,
    getEstimateTypeByCycleId,
    setPlotType,
    setEstimateType,
    currentProjectActiveCycleId,
    getActiveCycleProgress,
    progressLoader,
  } = useCycle();

  // props
  const { workspaceSlug, projectId, cycleId = currentProjectActiveCycleId, defaultCycle } = props;
  // derived values
  const cycle =
    defaultCycle ??
    (cycleId ? getCycleById(cycleId) : currentProjectActiveCycleId ? getCycleById(currentProjectActiveCycleId) : null);

  // fetches cycle details for non-pro users
  const { data: progress } = useSWR(
    workspaceSlug && projectId && cycle && cycle?.version === 1 ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS` : null,
    workspaceSlug && projectId && cycle && cycle?.version === 1
      ? () => fetchActiveCycleProgress(workspaceSlug, projectId, cycle.id)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetches cycle details for non-pro users
  const { data: distribution } = useSWR(
    workspaceSlug && projectId && cycle && !cycle?.distribution && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_DURATION`
      : null,
    workspaceSlug && projectId && cycle && !cycle?.distribution && cycle?.version === 1
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "issues")
      : null
  );
  // fetches cycle details for non-pro users
  const { data: estimate_distribution } = useSWR(
    workspaceSlug && projectId && cycle && !cycle?.estimate_distribution && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_ESTIMATE_DURATION`
      : null,
    workspaceSlug && projectId && cycle && !cycle?.estimate_distribution && cycle?.version === 1
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "points")
      : null
  );
  // fetches cycle details for pro users
  useSWR(
    workspaceSlug && projectId && cycleId && cycle?.version === 2
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_PRO`
      : null,
    workspaceSlug && projectId && cycleId && cycle?.version === 2
      ? () => fetchActiveCycleProgressPro(workspaceSlug, projectId, cycleId)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values
  const plotType: TCyclePlotType = (cycleId && getPlotTypeByCycleId(cycleId)) || "burndown";
  const estimateType: TCycleEstimateType = (cycleId && getEstimateTypeByCycleId(cycleId)) || "issues";

  const handlePlotChange = async (value: TCyclePlotType | TCycleEstimateType) => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    setPlotType(cycleId, value as TCyclePlotType);
  };

  const handleEstimateChange = async (value: TCyclePlotType | TCycleEstimateType) => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    setEstimateType(cycleId, value as TCycleEstimateType);
  };

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string[], redirect?: boolean) => {
      if (!workspaceSlug || !projectId || !cycleId) return;

      const newFilters: IIssueFilterOptions = {};
      Object.keys(issueFilters?.filters ?? {}).forEach((key) => {
        newFilters[key as keyof IIssueFilterOptions] = [];
      });

      let newValues: string[] = [];

      if (isEqual(newValues, value)) newValues = [];
      else newValues = value;

      updateFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        { ...newFilters, [key]: newValues },
        cycleId.toString()
      );
      if (redirect) router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`);
    },
    [workspaceSlug, projectId, cycleId, issueFilters, updateFilters, router]
  );
  const cycleData = cycleId && getActiveCycleProgress(cycleId);

  return {
    projectId,
    cycle,
    plotType,
    estimateType,
    cycleProgress:
      cycle &&
      formatActiveCycle({
        ...cycleData,
        cycle: {
          ...progress,
          distribution: distribution as TCycleDistribution,
          estimate_distribution: estimate_distribution as TCycleEstimateDistribution,
          ...cycle,
        },
      }), // formatted chart data
    progressLoader,
    handlePlotChange,
    handleFiltersUpdate,
    handleEstimateChange,
  };
};
export default useCycleDetails;
