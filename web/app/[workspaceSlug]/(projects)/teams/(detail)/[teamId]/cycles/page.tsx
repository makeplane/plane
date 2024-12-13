"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { Tabs, Loader } from "@plane/ui";
// plane web components
import { CyclePeekOverview } from "@/components/cycles";
import {
  TeamCurrentCyclesRoot,
  TeamUpcomingCyclesRoot,
  TeamCompletedCyclesRoot,
} from "@/plane-web/components/teams/cycles";
// plane web hooks
import { useTeamCycles } from "@/plane-web/hooks/store";

const TeamCyclesLoader = ({ height }: { height: string }) =>
  Array.from({ length: 3 }).map((_, index) => (
    <Loader className="px-5 pt-5 last:pb-5" key={index}>
      <Loader.Item height={height} width="100%" />
    </Loader>
  ));

const TeamCyclesPage = observer(() => {
  const { workspaceSlug, teamId } = useParams();
  // store hooks
  const { getTeamCyclesLoader, fetchTeamCycles } = useTeamCycles();
  // derived values
  const teamCyclesLoader = getTeamCyclesLoader(teamId!.toString());
  const isTeamCyclesLoading = teamCyclesLoader === "init-loader";
  // fetch team cycles
  useSWR(
    workspaceSlug && teamId ? ["teamCycles", workspaceSlug, teamId] : null,
    () => fetchTeamCycles(workspaceSlug!.toString(), teamId!.toString()),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const TEAM_CYCLES_TABS = [
    {
      key: "current",
      label: "Current",
      content: isTeamCyclesLoading ? (
        <TeamCyclesLoader height="256px" />
      ) : (
        <TeamCurrentCyclesRoot teamId={teamId!.toString()} workspaceSlug={workspaceSlug!.toString()} />
      ),
    },
    {
      key: "upcoming",
      label: "Upcoming",
      content: isTeamCyclesLoading ? (
        <TeamCyclesLoader height="98px" />
      ) : (
        <TeamUpcomingCyclesRoot teamId={teamId!.toString()} workspaceSlug={workspaceSlug!.toString()} />
      ),
    },
    {
      key: "completed",
      label: "Completed",
      content: isTeamCyclesLoading ? (
        <TeamCyclesLoader height="98px" />
      ) : (
        <TeamCompletedCyclesRoot teamId={teamId!.toString()} workspaceSlug={workspaceSlug!.toString()} />
      ),
    },
  ];

  return (
    <div className="flex w-full h-full">
      <Tabs
        tabs={TEAM_CYCLES_TABS}
        storageKey={`teams-cycles-${teamId}`}
        defaultTab="current"
        tabListContainerClassName="px-6 pt-4"
        tabListClassName="max-w-64"
        tabPanelClassName="py-2 h-full w-full overflow-hidden overflow-y-auto"
      />
      <CyclePeekOverview workspaceSlug={workspaceSlug!.toString()} isArchived={false} />
    </div>
  );
});

export default TeamCyclesPage;
