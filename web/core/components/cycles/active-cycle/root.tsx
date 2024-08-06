"use client";

import { useCallback } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Disclosure } from "@headlessui/react";
// types
import { IIssueFilterOptions } from "@plane/types";
// ui
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
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
// hooks
import { useCycle, useIssues } from "@/hooks/store";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // router
  const router = useRouter();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectActiveCycle, fetchActiveCycle, currentProjectActiveCycleId, getActiveCycleById } = useCycle();
  // derived values
  const activeCycle = currentProjectActiveCycleId ? getActiveCycleById(currentProjectActiveCycleId) : null;
  // fetch active cycle details
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ACTIVE_CYCLE_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchActiveCycle(workspaceSlug, projectId) : null
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string[], redirect?: boolean) => {
      if (!workspaceSlug || !projectId || !currentProjectActiveCycleId) return;

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
        currentProjectActiveCycleId.toString()
      );
      if (redirect) router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${currentProjectActiveCycleId}`);
    },
    [workspaceSlug, projectId, currentProjectActiveCycleId, issueFilters, updateFilters, router]
  );

  // show loader if active cycle is loading
  if (!currentProjectActiveCycle && isLoading)
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
              {!currentProjectActiveCycle ? (
                <EmptyState type={EmptyStateType.PROJECT_CYCLE_ACTIVE} size="sm" />
              ) : (
                <div className="flex flex-col bg-custom-background-90 border-b border-custom-border-200">
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
                      <ActiveCycleProgress cycle={activeCycle} handleFiltersUpdate={handleFiltersUpdate} />
                      <ActiveCycleProductivity
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        cycle={activeCycle}
                      />
                      <ActiveCycleStats
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        cycle={activeCycle}
                        cycleId={currentProjectActiveCycleId}
                        handleFiltersUpdate={handleFiltersUpdate}
                      />
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
