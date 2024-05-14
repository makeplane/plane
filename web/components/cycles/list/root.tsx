import { FC } from "react";
import { observer } from "mobx-react-lite";
import { Disclosure } from "@headlessui/react";
// components
import { ListLayout } from "@/components/core/list";
import { ActiveCycleRoot, CycleListGroupHeader, CyclePeekOverview, CyclesListMap } from "@/components/cycles";

export interface ICyclesList {
  completedCycleIds: string[];
  cycleIds: string[];
  workspaceSlug: string;
  projectId: string;
  isArchived?: boolean;
}

export const CyclesList: FC<ICyclesList> = observer((props) => {
  const { completedCycleIds, cycleIds, workspaceSlug, projectId, isArchived = false } = props;

  return (
    <div className="flex h-full w-full justify-between ">
      <ListLayout>
        {isArchived ? (
          <>
            <CyclesListMap cycleIds={cycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
          </>
        ) : (
          <>
            <ActiveCycleRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />

            <Disclosure as="div" className="flex flex-shrink-0 flex-col" defaultOpen>
              <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-7 py-1 cursor-pointer">
                <CycleListGroupHeader title="Upcoming cycle" type="upcoming" count={cycleIds.length} />
              </Disclosure.Button>
              <Disclosure.Panel>
                <CyclesListMap cycleIds={cycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
              </Disclosure.Panel>
            </Disclosure>

            <Disclosure as="div" className="flex flex-shrink-0 flex-col pb-7">
              <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-7 py-1 cursor-pointer">
                <CycleListGroupHeader title="Completed cycle" type="completed" count={completedCycleIds.length} />
              </Disclosure.Button>
              <Disclosure.Panel>
                <CyclesListMap cycleIds={completedCycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
              </Disclosure.Panel>
            </Disclosure>
          </>
        )}
      </ListLayout>
      <CyclePeekOverview projectId={projectId} workspaceSlug={workspaceSlug} isArchived={isArchived} />
    </div>
  );
});
