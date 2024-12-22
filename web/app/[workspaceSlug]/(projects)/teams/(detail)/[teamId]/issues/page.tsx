"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
// plane web components
import { TeamLayoutRoot } from "@/plane-web/components/issues/issue-layouts/roots/team-layout-root";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

const TeamIssuesPage = observer(() => {
  const { teamId } = useParams();
  // store
  const { getTeamById } = useTeams();

  if (!teamId) {
    return <></>;
  }

  // derived values
  const team = getTeamById(teamId.toString());
  const pageTitle = team?.name ? `${team?.name} - Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full">
        <TeamLayoutRoot />
      </div>
    </>
  );
});

export default TeamIssuesPage;
