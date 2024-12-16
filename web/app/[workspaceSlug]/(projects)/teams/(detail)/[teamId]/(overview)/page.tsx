"use client";

import { observer } from "mobx-react";
// plane web components
import { useParams } from "next/navigation";
import { TeamsOverviewRoot } from "@/plane-web/components/teams/overview/root";
import { useTeams } from "@/plane-web/hooks/store";

const TeamsOverviewPage = observer(() => {
  // router
  const { teamId } = useParams();
  // store
  const { getTeamById } = useTeams();
  // derived values
  const team = getTeamById(teamId?.toString());

  // Empty state if team is not found
  if (!teamId || !team) return null;

  return <TeamsOverviewRoot teamId={teamId.toString()} />;
});

export default TeamsOverviewPage;
