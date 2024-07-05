import { FC } from "react";
import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// components
import { CyclePeekOverview, CyclesBoardMap } from "@/components/cycles";
// helpers
import { cn } from "@/helpers/common.helper";

export interface ICyclesBoard {
  completedCycleIds: string[];
  cycleIds: string[];
  workspaceSlug: string;
  projectId: string;
  peekCycle: string | undefined;
}

export const CyclesBoard: FC<ICyclesBoard> = observer((props) => {
  const { completedCycleIds, cycleIds, workspaceSlug, projectId, peekCycle } = props;

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full justify-between">
        <div className="h-full w-full flex flex-col p-8 space-y-8 vertical-scrollbar scrollbar-lg">
          {cycleIds.length > 0 && (
            <CyclesBoardMap
              cycleIds={cycleIds}
              peekCycle={peekCycle}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          )}
          {completedCycleIds.length !== 0 && (
            <Disclosure as="div" className="space-y-4">
              <Disclosure.Button className="bg-custom-background-80 font-semibold text-sm py-1 px-2 rounded flex items-center gap-1">
                {({ open }) => (
                  <>
                    Completed cycles ({completedCycleIds.length})
                    <ChevronRight
                      className={cn("h-3 w-3 transition-all", {
                        "rotate-90": open,
                      })}
                    />
                  </>
                )}
              </Disclosure.Button>
              <Disclosure.Panel>
                <CyclesBoardMap
                  cycleIds={completedCycleIds}
                  peekCycle={peekCycle}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                />
              </Disclosure.Panel>
            </Disclosure>
          )}
        </div>
        <CyclePeekOverview projectId={projectId} workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
});
