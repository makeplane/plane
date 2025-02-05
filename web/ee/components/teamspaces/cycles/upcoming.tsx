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
import { useTeamspaceCycles } from "@/plane-web/hooks/store";

type TTeamUpcomingCyclesRoot = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamUpcomingCyclesRoot = observer((props: TTeamUpcomingCyclesRoot) => {
  const { teamspaceId, workspaceSlug } = props;
  // store hooks
  const { getTeamspaceFilteredUpcomingCycleIds, getTeamspaceGroupedUpcomingCycleIds } = useTeamspaceCycles();
  // derived values
  const filteredUpcomingCycleIds = getTeamspaceFilteredUpcomingCycleIds(teamspaceId);
  const groupedUpcomingCycleIds = getTeamspaceGroupedUpcomingCycleIds(teamspaceId);

  if (filteredUpcomingCycleIds.length === 0) {
    return <EmptyState type={EmptyStateType.TEAM_UPCOMING_CYCLES} />;
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
