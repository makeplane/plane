"use client";

import { observer } from "mobx-react";
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
} from "@/components/cycles";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCycle } from "@/hooks/store";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { fetchActiveCycle, currentProjectActiveCycleId, getActiveCycleById } = useCycle();
  // derived values
  const activeCycle = currentProjectActiveCycleId ? getActiveCycleById(currentProjectActiveCycleId) : null;
  // fetch active cycle details
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ACTIVE_CYCLE_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchActiveCycle(workspaceSlug, projectId) : null
  );

  // show loader if active cycle is loading
  if (!activeCycle && isLoading)
    return (
      <Loader>
        <Loader.Item height="250px" />
      </Loader>
    );

  return (
    <>
      <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-7 py-1 cursor-pointer">
              <CycleListGroupHeader title="Active cycle" type="current" isExpanded={open} />
            </Disclosure.Button>
            <Disclosure.Panel>
              {!activeCycle ? (
                <EmptyState type={EmptyStateType.PROJECT_CYCLE_ACTIVE} size="sm" />
              ) : (
                <div className="flex flex-col bg-custom-background-90 border-b">
                  {currentProjectActiveCycleId && (
                    <CyclesListItem
                      key={currentProjectActiveCycleId}
                      cycleId={currentProjectActiveCycleId}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      className="!border-b-transparent"
                    />
                  )}
                  <div className="bg-custom-background-100 pt-3 pb-6 px-6">
                    <div className="grid grid-cols-1 bg-custom-background-100 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                      <ActiveCycleProgress workspaceSlug={workspaceSlug} projectId={projectId} cycle={activeCycle} />
                      <ActiveCycleProductivity
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        cycle={activeCycle}
                      />
                      <ActiveCycleStats workspaceSlug={workspaceSlug} projectId={projectId} cycle={activeCycle} />
                    </div>
                  </div>
                </div>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
});
