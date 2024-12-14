import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// ui
import { ContentWrapper, ERowVariant } from "@plane/ui";
// components
import { CycleListProjectGroupHeader } from "@/components/cycles";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// plane web components
import { ActiveCycleRoot } from "@/plane-web/components/cycles/active-cycle";
// hooks
import { useTeamCycles } from "@/plane-web/hooks/store";

type TTeamCurrentCyclesRoot = {
  teamId: string;
  workspaceSlug: string;
};

export const TeamCurrentCyclesRoot = observer((props: TTeamCurrentCyclesRoot) => {
  const { teamId, workspaceSlug } = props;
  // store hooks
  const { getTeamFilteredActiveCycleIds, getTeamGroupedActiveCycleIds } = useTeamCycles();
  // derived values
  const filteredActiveCycleIds = getTeamFilteredActiveCycleIds(teamId);
  const groupedActiveCycleIds = getTeamGroupedActiveCycleIds(teamId);

  if (filteredActiveCycleIds.length === 0) {
    return <EmptyState type={EmptyStateType.WORKSPACE_ACTIVE_CYCLES} />;
  }

  return (
    <ContentWrapper variant={ERowVariant.HUGGING} className="relative">
      {Object.entries(groupedActiveCycleIds).map(([projectId, cycleId]) => (
        <Disclosure as="div" key={projectId} className="flex flex-shrink-0 flex-col" defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 cursor-pointer">
                <CycleListProjectGroupHeader projectId={projectId} isExpanded={open} />
              </Disclosure.Button>
              <Disclosure.Panel>
                <ActiveCycleRoot
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  cycleId={cycleId}
                  showHeader={false}
                />
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ))}
    </ContentWrapper>
  );
});
