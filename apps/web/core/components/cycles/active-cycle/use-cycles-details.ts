import { useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// plane imports
import type { TWorkItemFilterCondition } from "@plane/shared-state";
import { EIssuesStoreType } from "@plane/types";
// constants
import { CYCLE_ISSUES_WITH_PARAMS } from "@/constants/fetch-keys";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";

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
    issuesFilter: { updateFilterExpression },
    issues: { getActiveCycleById: getActiveCycleByIdFromIssue, fetchActiveCycleIssues },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { updateFilterExpressionFromConditions } = useWorkItemFilters();

  const { fetchActiveCycleProgress, getCycleById, fetchActiveCycleAnalytics } = useCycle();
  // derived values
  const cycle = cycleId ? getCycleById(cycleId) : null;

  // fetch cycle details
  useSWR(
    workspaceSlug && projectId && cycle?.id ? `PROJECT_ACTIVE_CYCLE_${projectId}_PROGRESS_${cycle.id}` : null,
    workspaceSlug && projectId && cycle?.id ? () => fetchActiveCycleProgress(workspaceSlug, projectId, cycle.id) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  useSWR(
    workspaceSlug && projectId && cycle?.id && !cycle?.distribution
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_DURATION_${cycle.id}`
      : null,
    workspaceSlug && projectId && cycle?.id && !cycle?.distribution
      ? () => fetchActiveCycleAnalytics(workspaceSlug, projectId, cycle.id, "issues")
      : null
  );
  useSWR(
    workspaceSlug && projectId && cycle?.id && !cycle?.estimate_distribution
      ? `PROJECT_ACTIVE_CYCLE_${projectId}_ESTIMATE_DURATION_${cycle.id}`
      : null,
    workspaceSlug && projectId && cycle?.id && !cycle?.estimate_distribution
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
    async (conditions: TWorkItemFilterCondition[]) => {
      if (!workspaceSlug || !projectId || !cycleId) return;

      await updateFilterExpressionFromConditions(
        EIssuesStoreType.CYCLE,
        cycleId,
        conditions,
        updateFilterExpression.bind(updateFilterExpression, workspaceSlug, projectId, cycleId)
      );

      router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`);
    },
    [workspaceSlug, projectId, cycleId, updateFilterExpressionFromConditions, updateFilterExpression, router]
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
