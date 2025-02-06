import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// components
import { CycleListProjectGroupHeader, CyclesListMap } from "@/components/cycles";
// hooks
import { DetailedEmptyState } from "@/components/empty-state";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useTeamspaceCycles } from "@/plane-web/hooks/store";

type TeamCompletedCyclesRootProps = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamCompletedCyclesRoot = observer((props: TeamCompletedCyclesRootProps) => {
  const { teamspaceId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamspaceFilteredCompletedCycleIds, getTeamspaceGroupedCompletedCycleIds } = useTeamspaceCycles();
  // derived values
  const filteredCompletedCycleIds = getTeamspaceFilteredCompletedCycleIds(teamspaceId);
  const groupedCompletedCycleIds = getTeamspaceGroupedCompletedCycleIds(teamspaceId);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/teams/completed-cycles" });

  if (filteredCompletedCycleIds.length === 0) {
    return (
      <DetailedEmptyState
        title={t("teamspace_cycles.empty_state.completed.title")}
        description={t("teamspace_cycles.empty_state.completed.description")}
        assetPath={resolvedPath}
      />
    );
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
