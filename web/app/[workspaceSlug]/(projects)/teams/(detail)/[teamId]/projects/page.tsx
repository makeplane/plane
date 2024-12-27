"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane web components
import { PageHead } from "@/components/core";
// plane web hooks
import { TeamProjectsWithGroupingRoot, TeamProjectsWithoutGroupingRoot } from "@/plane-web/components/teams/projects";
import { useFlag, useTeams, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const TeamProjectsPage = observer(() => {
  const { workspaceSlug, teamId } = useParams();
  // store hooks
  const { getTeamById } = useTeams();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const team = teamId ? getTeamById(teamId.toString()) : undefined;
  const pageTitle = team?.name ? `${team?.name} - Projects` : undefined;
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");

  if (!team) return null;
  return (
    <>
      <PageHead title={pageTitle} />
      {isProjectGroupingEnabled ? (
        <TeamProjectsWithGroupingRoot workspaceSlug={workspaceSlug.toString()} />
      ) : (
        <TeamProjectsWithoutGroupingRoot workspaceSlug={workspaceSlug.toString()} team={team} />
      )}
    </>
  );
});

export default TeamProjectsPage;
