"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
// plane web components
import { TeamspaceProjectWorkLayoutRoot } from "@/plane-web/components/issues/issue-layouts/roots/teamspace-project-root";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

const TeamspaceProjectDetailPage = observer(() => {
  const { teamspaceId } = useParams();
  // store
  const { getTeamspaceById } = useTeamspaces();

  if (!teamspaceId) {
    return <></>;
  }

  // derived values
  const teamspace = getTeamspaceById(teamspaceId.toString());
  const pageTitle = teamspace?.name ? `${teamspace?.name} - Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full">
        <TeamspaceProjectWorkLayoutRoot />
      </div>
    </>
  );
});

export default TeamspaceProjectDetailPage;
