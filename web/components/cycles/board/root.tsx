import { FC } from "react";
import { observer } from "mobx-react-lite";
import { Disclosure } from "@headlessui/react";
import { ChevronRight } from "lucide-react";
// components
import { CyclePeekOverview, CyclesBoardCard } from "components/cycles";
// helpers
import { cn } from "helpers/common.helper";

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
          <div
            className={`w-full grid grid-cols-1 gap-6 ${
              peekCycle
                ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3"
                : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
            } auto-rows-max transition-all`}
          >
            {cycleIds.map((cycleId) => (
              <CyclesBoardCard key={cycleId} workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />
            ))}
          </div>
          {completedCycleIds.length !== 0 && (
            <Disclosure as="div" className="space-y-4">
              <Disclosure.Button className="bg-custom-background-80 font-semibold text-sm py-1 px-2 rounded flex items-center gap-1">
                {({ open }) => (
                  <>
                    Completed cycles{" "}
                    <ChevronRight
                      className={cn("h-3 w-3 transition-all", {
                        "rotate-90": open,
                      })}
                    />
                  </>
                )}
              </Disclosure.Button>
              <Disclosure.Panel>
                <div
                  className={`w-full grid grid-cols-1 gap-6 ${
                    peekCycle
                      ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3"
                      : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
                  } auto-rows-max transition-all`}
                >
                  {completedCycleIds.map((cycleId) => (
                    <CyclesBoardCard
                      key={cycleId}
                      cycleId={cycleId}
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                    />
                  ))}
                </div>
              </Disclosure.Panel>
            </Disclosure>
          )}
        </div>
        <CyclePeekOverview projectId={projectId} workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
});
