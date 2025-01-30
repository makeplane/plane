"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { LogoSpinner } from "@/components/common";
// plane web components
import { TeamsOverviewRoot } from "@/plane-web/components/teamspaces/overview/root";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

const TeamspaceOverviewPage = observer(() => {
  // router
  const { teamspaceId } = useParams();
  // store
  const { loader, getTeamspaceById } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId?.toString());

  if (loader === "init-loader")
    return (
      <div className="h-full w-full flex justify-center items-center">
        <LogoSpinner />
      </div>
    );

  // Empty state if teamspace is not found
  if (!teamspaceId || !teamspace) return null;

  return <TeamsOverviewRoot teamspaceId={teamspaceId.toString()} />;
});

export default TeamspaceOverviewPage;
