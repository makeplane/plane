"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// ui
import { Row } from "@plane/ui";
// components
import {
  ActiveCycleProductivity,
  ActiveCycleProgress,
  ActiveCycleStats,
  CycleListGroupHeader,
  CyclesListItem,
} from "@/components/cycles";
import useCyclesDetails from "@/components/cycles/active-cycle/use-cycles-details";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { useCycle } from "@/hooks/store";
import { ActiveCycleIssueDetails } from "@/store/issue/cycle";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  showHeader?: boolean;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  const { workspaceSlug, projectId, cycleId: propsCycleId, showHeader = true } = props;
  const { currentProjectActiveCycleId } = useCycle();
  // derived values
  const cycleId = propsCycleId ?? currentProjectActiveCycleId;
  // fetch cycle details
  const {
    handleFiltersUpdate,
    cycle: activeCycle,
    cycleIssueDetails,
  } = useCyclesDetails({ workspaceSlug, projectId, cycleId });

  const ActiveCyclesComponent = useMemo(
    () => (
      <>
        {!cycleId || !activeCycle ? (
          <EmptyState type={EmptyStateType.PROJECT_CYCLE_ACTIVE} size="sm" />
        ) : (
          <div className="flex flex-col border-b border-custom-border-200">
            {cycleId && (
              <CyclesListItem
                key={cycleId}
                cycleId={cycleId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                className="!border-b-transparent"
              />
            )}
            <Row className="bg-custom-background-100 pt-3 pb-6">
              <div className="grid grid-cols-1 bg-custom-background-100 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                <ActiveCycleProgress
                  handleFiltersUpdate={handleFiltersUpdate}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                  cycle={activeCycle}
                />
                <ActiveCycleProductivity workspaceSlug={workspaceSlug} projectId={projectId} cycle={activeCycle} />
                <ActiveCycleStats
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  cycle={activeCycle}
                  cycleId={cycleId}
                  handleFiltersUpdate={handleFiltersUpdate}
                  cycleIssueDetails={cycleIssueDetails as ActiveCycleIssueDetails}
                />
              </div>
            </Row>
          </div>
        )}
      </>
    ),
    [cycleId, activeCycle, workspaceSlug, projectId, handleFiltersUpdate, cycleIssueDetails]
  );

  return (
    <>
      {showHeader ? (
        <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 cursor-pointer">
                <CycleListGroupHeader title="Active cycle" type="current" isExpanded={open} />
              </Disclosure.Button>
              <Disclosure.Panel>{ActiveCyclesComponent}</Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ) : (
        <>{ActiveCyclesComponent}</>
      )}
    </>
  );
});
