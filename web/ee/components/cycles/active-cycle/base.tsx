"use client";

import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// ui
import ActiveCycleDetail from "./details";
import { CycleProgressHeader } from "./progress-header";
// constants
import useCycleDetails from "./use-cycle-details";

type IActiveCycleDetails = {
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleBase: React.FC<IActiveCycleDetails> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  const cycleDetails = useCycleDetails({ workspaceSlug, projectId });

  if (!cycleDetails.cycle) return;

  return (
    <>
      <Disclosure as="div" className="flex flex-shrink-0 flex-col border-b border-custom-border-200" defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 cursor-pointer">
              <CycleProgressHeader
                cycleDetails={cycleDetails.cycle}
                progress={cycleDetails.cycleProgress}
                projectId={projectId}
                cycleId={cycleDetails.cycle?.id || "  "}
                workspaceSlug={workspaceSlug}
                progressLoader={cycleDetails.progressLoader}
              />
            </Disclosure.Button>
            <Disclosure.Panel>
              <ActiveCycleDetail {...cycleDetails} />
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
});
