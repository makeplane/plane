"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
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
import { DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useCycle } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { ActiveCycleIssueDetails } from "@/store/issue/cycle";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  showHeader?: boolean;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  const { workspaceSlug, projectId, cycleId: propsCycleId, showHeader = true } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentProjectActiveCycleId } = useCycle();
  // derived values
  const cycleId = propsCycleId ?? currentProjectActiveCycleId;
  const activeCycleResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/cycle/active" });
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
          <DetailedEmptyState
            title={t("project_cycles.empty_state.active.title")}
            description={t("project_cycles.empty_state.active.description")}
            assetPath={activeCycleResolvedPath}
          />
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
                <CycleListGroupHeader title={t("project_cycles.active_cycle.label")} type="current" isExpanded={open} />
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
