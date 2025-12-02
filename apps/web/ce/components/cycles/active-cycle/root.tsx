"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Row } from "@plane/ui";
// components
import { ActiveCycleStats } from "@/components/cycles/active-cycle/cycle-stats";
import { ActiveCycleProductivity } from "@/components/cycles/active-cycle/productivity";
import { ActiveCycleProgress } from "@/components/cycles/active-cycle/progress";
import useCyclesDetails from "@/components/cycles/active-cycle/use-cycles-details";
import { CycleListGroupHeader } from "@/components/cycles/list/cycle-list-group-header";
import { CyclesListItem } from "@/components/cycles/list/cycles-list-item";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import type { ActiveCycleIssueDetails } from "@/store/issue/cycle";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  cycleIds?: string[];
  showHeader?: boolean;
}

interface ISingleActiveCycleProps {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  defaultOpen?: boolean;
}

const SingleActiveCycle: React.FC<ISingleActiveCycleProps> = observer((props) => {
  const { workspaceSlug, projectId, cycleId, defaultOpen = false } = props;
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const {
    handleFiltersUpdate,
    cycle: activeCycle,
    cycleIssueDetails,
  } = useCyclesDetails({ workspaceSlug, projectId, cycleId });

  if (!activeCycle) return null;

  return (
    <div className="flex flex-col border-b border-custom-border-200">
      <div className="flex items-center justify-between pr-4 bg-custom-background-100">
        <div className="flex-grow">
          <CyclesListItem
            key={cycleId}
            cycleId={cycleId}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            className="!border-b-transparent"
          />
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 hover:bg-custom-background-80 rounded transition-colors duration-200"
        >
          <ChevronDown className={`h-4 w-4 text-custom-sidebar-text-300 duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      <Transition
        show={isOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
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
      </Transition>
    </div>
  );
});

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  const { workspaceSlug, projectId, cycleId: propsCycleId, cycleIds: propsCycleIds, showHeader = true } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentProjectActiveCycleId, getCycleById } = useCycle();
  // derived values
  const activeCycleResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/cycle/active" });

  // Determine active cycle IDs
  const activeCycleIds = useMemo(() => {
    if (propsCycleIds && propsCycleIds.length > 0) {
      // Filter cycleIds to ensure they are actually active cycles
      return propsCycleIds.filter((id) => {
        const cycle = getCycleById(id);
        return cycle?.status?.toLowerCase() === "current";
      });
    }
    if (propsCycleId) {
      const cycle = getCycleById(propsCycleId);
      return cycle?.status?.toLowerCase() === "current" ? [propsCycleId] : [];
    }
    if (currentProjectActiveCycleId) {
      return [currentProjectActiveCycleId];
    }
    return [];
  }, [propsCycleIds, propsCycleId, currentProjectActiveCycleId, getCycleById]);

  const ActiveCyclesComponent = useMemo(
    () => (
      <>
        {activeCycleIds.length === 0 ? (
          <DetailedEmptyState
            title={t("project_cycles.empty_state.active.title")}
            description={t("project_cycles.empty_state.active.description")}
            assetPath={activeCycleResolvedPath}
          />
        ) : (
          <div className="flex flex-col">
            {activeCycleIds.map((id) => (
              <SingleActiveCycle
                key={id}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                cycleId={id}
                defaultOpen={false}
              />
            ))}
          </div>
        )}
      </>
    ),
    [activeCycleIds, workspaceSlug, projectId, activeCycleResolvedPath, t]
  );

  return (
    <>
      {showHeader ? (
        <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 cursor-pointer">
                <CycleListGroupHeader
                  title={t("project_cycles.active_cycle.label")}
                  type="current"
                  isExpanded={open}
                  count={activeCycleIds.length}
                  showCount
                />
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
