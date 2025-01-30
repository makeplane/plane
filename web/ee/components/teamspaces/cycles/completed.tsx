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

type TeamCompletedCyclesRootProps = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamCompletedCyclesRoot = observer((props: TeamCompletedCyclesRootProps) => {
  const { teamspaceId, workspaceSlug } = props;
  // store hooks
  const { getTeamspaceFilteredCompletedCycleIds, getTeamspaceGroupedCompletedCycleIds } = useTeamspaceCycles();
  // derived values
  const filteredCompletedCycleIds = getTeamspaceFilteredCompletedCycleIds(teamspaceId);
  const groupedCompletedCycleIds = getTeamspaceGroupedCompletedCycleIds(teamspaceId);

  if (filteredCompletedCycleIds.length === 0) {
    return <EmptyState type={EmptyStateType.TEAM_COMPLETED_CYCLES} />;
  }

  return (
    <ContentWrapper variant={ERowVariant.HUGGING}>
      {Object.entries(groupedCompletedCycleIds).map(([projectId, cycleIds]) => (
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
