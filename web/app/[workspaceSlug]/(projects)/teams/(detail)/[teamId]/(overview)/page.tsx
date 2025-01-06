"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { LogoSpinner } from "@/components/common";
// plane web components
import { TeamsOverviewRoot } from "@/plane-web/components/teams/overview/root";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

const TeamsOverviewPage = observer(() => {
  // router
  const { teamId } = useParams();
  // store
  const { loader, getTeamById } = useTeams();
  // derived values
  const team = getTeamById(teamId?.toString());

  if (loader === "init-loader")
    return (
      <div className="h-full w-full flex justify-center items-center">
        <LogoSpinner />
      </div>
    );

  // Empty state if team is not found
  if (!teamId || !team) return null;

  return <TeamsOverviewRoot teamId={teamId.toString()} />;
});

export default TeamsOverviewPage;
