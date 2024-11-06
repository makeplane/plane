import { useCallback } from "react";
import isEqual from "lodash/isEqual";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { IIssueFilterOptions } from "@plane/types";
import { CYCLE_ISSUES_WITH_PARAMS } from "@/constants/fetch-keys";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { useCycle, useIssues } from "@/hooks/store";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
  cycleId: string | null | undefined;
}

const useCyclesDetails = (props: IActiveCycleDetails) => {
  // props
  const { workspaceSlug, projectId, cycleId } = props;
  // router
  const router = useRouter();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
    issues: { getActiveCycleById: getActiveCycleByIdFromIssue, fetchActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);

  const { fetchActiveCycleProgress, getCycleById, fetchActiveCycleAnalytics } = useCycle();
  // derived values
  const cycle = cycleId ? getCycleById(cycleId) : null;

  // fetch cycle details
  useSWR(
    workspaceSlug && projectId && cycle ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS` : null,
    workspaceSlug && projectId && cycle ? () => fetchActiveCycleProgress(workspaceSlug, projectId, cycle.id) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  useSWR(
    workspaceSlug && projectId && cycle && !cycle?.distribution ? `PROJECT_ACTIVE_CYCLE_${projectId}_DURATION` : null,
    workspaceSlug && projectId && cycle && !cycle?.distribution
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "issues")
      : null
  );
  useSWR(
    workspaceSlug && projectId && cycle && !cycle?.estimate_distribution
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_ESTIMATE_DURATION`
      : null,
    workspaceSlug && projectId && cycle && !cycle?.estimate_distribution
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "points")
      : null
  );
  useSWR(
    workspaceSlug && projectId && cycle?.id ? CYCLE_ISSUES_WITH_PARAMS(cycle?.id, { priority: "urgent,high" }) : null,
    workspaceSlug && projectId && cycle?.id
      ? () => fetchActiveCycleIssues(workspaceSlug, projectId, 30, cycle?.id)
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const cycleIssueDetails = cycle?.id ? getActiveCycleByIdFromIssue(cycle?.id) : { nextPageResults: false };

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
    cycle,
    cycleId,
    router,
    handleFiltersUpdate,
    cycleIssueDetails,
  };
};
export default useCyclesDetails;
