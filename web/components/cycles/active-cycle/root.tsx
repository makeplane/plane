import { observer } from "mobx-react-lite";
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// components
import {
  ActiveCycleHeader,
  ActiveCycleProductivity,
  ActiveCycleProgress,
  ActiveCycleStats,
  UpcomingCyclesList,
} from "@/components/cycles";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCycle, useCycleFilter } from "@/hooks/store";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { fetchActiveCycle, currentProjectActiveCycleId, currentProjectUpcomingCycleIds, getActiveCycleById } =
    useCycle();
  // cycle filters hook
  const { updateDisplayFilters } = useCycleFilter();
  // derived values
  const activeCycle = currentProjectActiveCycleId ? getActiveCycleById(currentProjectActiveCycleId) : null;
  // fetch active cycle details
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ACTIVE_CYCLE_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchActiveCycle(workspaceSlug, projectId) : null
  );

  const handleEmptyStateAction = () =>
    updateDisplayFilters(projectId, {
      active_tab: "all",
    });

  // show loader if active cycle is loading
  if (!activeCycle && isLoading)
    return (
      <Loader>
        <Loader.Item height="250px" />
      </Loader>
    );

  if (!activeCycle) {
    // show empty state if no active cycle is present
    if (currentProjectUpcomingCycleIds?.length === 0)
      return <EmptyState type={EmptyStateType.PROJECT_CYCLE_ACTIVE} size="sm" />;
    // show upcoming cycles list, if present
    else
      return (
        <>
          <div className="h-52 w-full grid place-items-center mb-6">
            <div className="text-center">
              <h5 className="text-xl font-medium mb-1">No active cycle</h5>
              <p className="text-custom-text-400 text-base">
                Create new cycles to find them here or check
                <br />
                {"'"}All{"'"} cycles tab to see all cycles or{" "}
                <button type="button" className="text-custom-primary-100 font-medium" onClick={handleEmptyStateAction}>
                  click here
                </button>
              </p>
            </div>
          </div>
          <UpcomingCyclesList handleEmptyStateAction={handleEmptyStateAction} />
        </>
      );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <ActiveCycleHeader cycle={activeCycle} workspaceSlug={workspaceSlug} projectId={projectId} />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <ActiveCycleProgress cycle={activeCycle} />
          <ActiveCycleProductivity cycle={activeCycle} />
          <ActiveCycleStats cycle={activeCycle} workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      </div>
      {currentProjectUpcomingCycleIds && <UpcomingCyclesList handleEmptyStateAction={handleEmptyStateAction} />}
    </>
  );
});
