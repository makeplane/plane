import { useCallback } from "react";
import isEqual from "lodash/isEqual";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { EIssueFilterType } from "@plane/constants";
import {
  EIssuesStoreType,
  IActiveCycle,
  ICycle,
  IIssueFilterOptions,
  TCycleEstimateType,
  TCyclePlotType,
  TCycleEstimateSystemAdvanced,
} from "@plane/types";
import { useCycle } from "@/hooks/store/use-cycle"
import { useIssues } from "@/hooks/store/use-issues"
import { useProjectEstimates } from "@/hooks/store/estimates";
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
    progressLoader,
  } = useCycle();
  const { currentProjectEstimateType } = useProjectEstimates();

  // props
  const { workspaceSlug, projectId, cycleId = currentProjectActiveCycleId, defaultCycle } = props;
  // derived values
  const storeCycle = cycleId
    ? getCycleById(cycleId)
    : currentProjectActiveCycleId
      ? getCycleById(currentProjectActiveCycleId)
      : null;
  const cycle = defaultCycle ?? storeCycle;

  // fetches cycle details for non-pro users
  useSWR(
    workspaceSlug && projectId && cycle?.id && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
      : null,
    workspaceSlug && projectId && cycle?.id && cycle?.version === 1
      ? () => fetchActiveCycleProgress(workspaceSlug, projectId, cycle.id)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetches cycle details for non-pro users
  useSWR(
    workspaceSlug && projectId && cycle?.id && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_DURATION_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
      : null,
    workspaceSlug && projectId && cycle?.id && cycle?.version === 1
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "issues")
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetches cycle details for non-pro users
  useSWR(
    workspaceSlug && projectId && cycle?.id && cycle?.version === 1
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_ESTIMATE_DURATION_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
      : null,
    workspaceSlug && projectId && cycle?.id && cycle?.version === 1
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "points")
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // fetches cycle details for pro users
  useSWR(
    workspaceSlug && projectId && cycleId && cycle?.version === 2
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_PRO_${cycle.start_date}_${cycle.end_date}_${cycle.id}`
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
  return {
    projectId,
    cycle: { ...cycle, ...storeCycle } as ICycle,
    plotType,
    estimateType,
    cycleProgress:
      cycle &&
      formatActiveCycle({
        isTypeIssue: estimateType === "issues",
        isBurnDown: plotType === "burndown",
        estimateType: currentProjectEstimateType as TCycleEstimateSystemAdvanced,
        cycle: {
          ...storeCycle,
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
