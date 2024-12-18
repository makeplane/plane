import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// ui
import { ContentWrapper, ERowVariant } from "@plane/ui";
// components
import { CycleListProjectGroupHeader, CyclesListMap } from "@/components/cycles";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useTeamCycles } from "@/plane-web/hooks/store";

type TTeamUpcomingCyclesRoot = {
  teamId: string;
  workspaceSlug: string;
};

export const TeamUpcomingCyclesRoot = observer((props: TTeamUpcomingCyclesRoot) => {
  const { teamId, workspaceSlug } = props;
  // store hooks
  const { getTeamFilteredUpcomingCycleIds, getTeamGroupedUpcomingCycleIds } = useTeamCycles();
  // derived values
  const filteredUpcomingCycleIds = getTeamFilteredUpcomingCycleIds(teamId);
  const groupedUpcomingCycleIds = getTeamGroupedUpcomingCycleIds(teamId);

  // TODO: Update the empty state
  if (filteredUpcomingCycleIds.length === 0) {
    return <EmptyState type={EmptyStateType.PROJECT_CYCLE_ALL} />;
  }

  return (
    <ContentWrapper variant={ERowVariant.HUGGING} className="relative">
      {Object.entries(groupedUpcomingCycleIds).map(([projectId, cycleIds]) => (
        <Disclosure as="div" key={projectId} className="flex flex-shrink-0 flex-col" defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 cursor-pointer">
                <CycleListProjectGroupHeader
                  projectId={projectId}
                  count={cycleIds.length}
                  showCount
                  isExpanded={open}
                />
              </Disclosure.Button>
              <Disclosure.Panel>
                <CyclesListMap cycleIds={cycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ))}
    </ContentWrapper>
  );
});
