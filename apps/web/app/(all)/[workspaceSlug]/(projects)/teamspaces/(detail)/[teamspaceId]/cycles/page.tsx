"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Tabs, Loader } from "@plane/ui";
// plane web components
import { CyclePeekOverview } from "@/components/cycles/cycle-peek-overview";
import {
  TeamCurrentCyclesRoot,
  TeamUpcomingCyclesRoot,
  TeamCompletedCyclesRoot,
} from "@/plane-web/components/teamspaces/cycles";
// plane web hooks
import { useTeamspaceCycles } from "@/plane-web/hooks/store";

const TeamspaceCyclesLoader = ({ height }: { height: string }) =>
  Array.from({ length: 3 }).map((_, index) => (
    <Loader className="px-5 pt-5 last:pb-5" key={index}>
      <Loader.Item height={height} width="100%" />
    </Loader>
  ));

const TeamspaceCyclesPage = observer(() => {
  const { workspaceSlug, teamspaceId } = useParams();
  // store hooks
  const { getTeamspaceCyclesLoader, fetchTeamspaceCycles } = useTeamspaceCycles();
  // derived values
  const teamspaceCyclesLoader = getTeamspaceCyclesLoader(teamspaceId!.toString());
  const isTeamspaceCyclesLoading = teamspaceCyclesLoader === "init-loader";
  // fetch teamspace cycles
  useSWR(
    workspaceSlug && teamspaceId ? ["teamspaceCycles", workspaceSlug, teamspaceId] : null,
    () => fetchTeamspaceCycles(workspaceSlug!.toString(), teamspaceId!.toString()),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const TEAM_CYCLES_TABS = [
    {
      key: "current",
      label: "Current",
      content: isTeamspaceCyclesLoading ? (
        <TeamspaceCyclesLoader height="256px" />
      ) : (
        <TeamCurrentCyclesRoot teamspaceId={teamspaceId!.toString()} workspaceSlug={workspaceSlug!.toString()} />
      ),
    },
    {
      key: "upcoming",
      label: "Upcoming",
      content: isTeamspaceCyclesLoading ? (
        <TeamspaceCyclesLoader height="98px" />
      ) : (
        <TeamUpcomingCyclesRoot teamspaceId={teamspaceId!.toString()} workspaceSlug={workspaceSlug!.toString()} />
      ),
    },
    {
      key: "completed",
      label: "Completed",
      content: isTeamspaceCyclesLoading ? (
        <TeamspaceCyclesLoader height="98px" />
      ) : (
        <TeamCompletedCyclesRoot teamspaceId={teamspaceId!.toString()} workspaceSlug={workspaceSlug!.toString()} />
      ),
    },
  ];

  return (
    <div className="flex w-full h-full">
      <Tabs
        tabs={TEAM_CYCLES_TABS}
        storageKey={`teamspace-cycles-${teamspaceId}`}
        defaultTab="current"
        size="sm"
        tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 divide-x divide-custom-border-200"
        tabListClassName="my-2 max-w-64"
        tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
      />
      <CyclePeekOverview workspaceSlug={workspaceSlug!.toString()} isArchived={false} />
    </div>
  );
});

export default TeamspaceCyclesPage;
