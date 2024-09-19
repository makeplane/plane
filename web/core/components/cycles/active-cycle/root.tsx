"use client";

import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// ui
import { Row } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { useCycle } from "@/hooks/store";
import { CycleProgressHeader } from "./progress-header";
import ActiveCycleChart from "./cycle-chart/chart";
import { useState } from "react";
import Summary from "./summary";
import Selection from "./selection";
import useActiveCycle from "./use-active-cycle";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleRoot: React.FC<IActiveCycleDetails> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  const {
    plotType,
    estimateType,
    handlePlotChange,
    handleEstimateChange,
    cycle: activeCycle,
  } = useActiveCycle(workspaceSlug, projectId);
  const { activeCycleProgress } = useCycle();

  const [areaToHighlight, setAreaToHighlight] = useState<string>("");

  if (!activeCycle) return;

  return (
    <>
      <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 cursor-pointer">
              <CycleProgressHeader
                cycleDetails={activeCycle}
                progress={activeCycleProgress}
                projectId={projectId}
                cycleId={activeCycle.id}
                workspaceSlug={workspaceSlug}
              />
            </Disclosure.Button>
            <Disclosure.Panel>
              {!activeCycle ? (
                <EmptyState type={EmptyStateType.PROJECT_CYCLE_ACTIVE} size="sm" />
              ) : (
                <div className="flex flex-col border-b border-custom-border-200">
                  {activeCycleProgress && (
                    <Row className="flex bg-custom-background-100 md:h-[420px] justify-between !pr-0 flex-col md:flex-row">
                      <Summary
                        setAreaToHighlight={setAreaToHighlight}
                        data={activeCycleProgress}
                        plotType={plotType}
                        estimateType={estimateType}
                      />
                      <div className="h-full w-full flex-1">
                        <Selection
                          plotType={plotType}
                          estimateType={estimateType}
                          handlePlotChange={handlePlotChange}
                          handleEstimateChange={handleEstimateChange}
                        />
                        <ActiveCycleChart
                          areaToHighlight={areaToHighlight}
                          data={activeCycleProgress}
                          cycle={activeCycle}
                        />
                      </div>
                    </Row>
                  )}
                </div>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
});
