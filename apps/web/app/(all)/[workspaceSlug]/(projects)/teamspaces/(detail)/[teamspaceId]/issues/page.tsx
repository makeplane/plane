"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core/page-title";
// plane web components
import { TeamspaceLayoutRoot } from "@/plane-web/components/issues/issue-layouts/roots/teamspace-layout-root";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

const TeamspaceWorkItemsPage = observer(() => {
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
        <TeamspaceLayoutRoot />
      </div>
    </>
  );
});

export default TeamspaceWorkItemsPage;
