import { observer } from "mobx-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// components
import { CycleListProjectGroupHeader } from "@/components/cycles/list/cycle-list-project-group-header";
import { CyclesListMap } from "@/components/cycles/list/cycles-list-map";
// hooks
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { useTeamspaceCycles } from "@/plane-web/hooks/store";

type TTeamUpcomingCyclesRoot = {
  teamspaceId: string;
  workspaceSlug: string;
};

export const TeamUpcomingCyclesRoot = observer((props: TTeamUpcomingCyclesRoot) => {
  const { teamspaceId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getTeamspaceFilteredUpcomingCycleIds, getTeamspaceGroupedUpcomingCycleIds } = useTeamspaceCycles();
  // derived values
  const filteredUpcomingCycleIds = getTeamspaceFilteredUpcomingCycleIds(teamspaceId);
  const groupedUpcomingCycleIds = getTeamspaceGroupedUpcomingCycleIds(teamspaceId);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/teams/upcoming-cycles" });

  if (filteredUpcomingCycleIds.length === 0) {
    return (
      <DetailedEmptyState
        title={t("teamspace_cycles.empty_state.upcoming.title")}
        description={t("teamspace_cycles.empty_state.upcoming.description")}
        assetPath={resolvedPath}
      />
    );
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
