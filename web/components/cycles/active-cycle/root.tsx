import { observer } from "mobx-react-lite";
import useSWR from "swr";
// ui
import { Disclosure } from "@headlessui/react";
import { Loader } from "@plane/ui";
// components
import {
  ActiveCycleProductivity,
  ActiveCycleProgress,
  ActiveCycleStats,
  CycleListGroupHeader,
  CyclesListItem,
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
          <div className="mb-6 grid h-52 w-full place-items-center">
            <div className="text-center">
              <h5 className="mb-1 text-xl font-medium">No active cycle</h5>
              <p className="text-base text-custom-text-400">
                Create new cycles to find them here or check
                <br />
                {"'"}All{"'"} cycles tab to see all cycles or{" "}
                <button type="button" className="font-medium text-custom-primary-100" onClick={handleEmptyStateAction}>
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
      <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
        <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-7 py-1 cursor-pointer">
          <CycleListGroupHeader title="Active cycle" type="current" />
        </Disclosure.Button>
        <Disclosure.Panel>
          <div className="flex flex-col bg-custom-background-90 border-b">
            {currentProjectActiveCycleId && (
              <CyclesListItem
                key={currentProjectActiveCycleId}
                cycleId={currentProjectActiveCycleId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
              />
            )}
            <div className="bg-custom-background-90 py-6 px-8">
              <div className="grid grid-cols-1 bg-custom-background-90 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                <ActiveCycleProgress cycle={activeCycle} />
                <ActiveCycleProductivity cycle={activeCycle} />
                <ActiveCycleStats cycle={activeCycle} workspaceSlug={workspaceSlug} projectId={projectId} />
              </div>
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </>
  );
});
