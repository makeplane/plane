import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// components
import { CycleListProjectGroupHeader } from "@/components/cycles/list/cycle-list-project-group-header";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { ActiveCycleRoot } from "@/plane-web/components/cycles/active-cycle";
// hooks
import { useTeamspaceCycles } from "@/plane-web/hooks/store";

type TTeamCurrentCyclesRoot = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamCurrentCyclesRoot = observer((props: TTeamCurrentCyclesRoot) => {
  const { teamspaceId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamspaceFilteredActiveCycleIds, getTeamspaceGroupedActiveCycleIds } = useTeamspaceCycles();
  // derived values
  const filteredActiveCycleIds = getTeamspaceFilteredActiveCycleIds(teamspaceId);
  const groupedActiveCycleIds = getTeamspaceGroupedActiveCycleIds(teamspaceId);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/teams/current-cycles" });

  if (filteredActiveCycleIds.length === 0) {
    return (
      <DetailedEmptyState
        title={t("teamspace_cycles.empty_state.current.title")}
        description={t("teamspace_cycles.empty_state.current.description")}
        assetPath={resolvedPath}
      />
    );
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
