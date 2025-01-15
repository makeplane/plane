"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// plane web imports
import { TeamProjectsWithGroupingRoot, TeamProjectsWithoutGroupingRoot } from "@/plane-web/components/teams/projects";
import { useFlag, useTeams, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const TeamProjectsPage = observer(() => {
  const { workspaceSlug, teamId } = useParams();
  // store hooks
  const { getTeamById, getTeamProjectIds } = useTeams();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const team = teamId ? getTeamById(teamId.toString()) : undefined;
  const teamProjectIds = teamId ? getTeamProjectIds(teamId.toString()) : undefined;
  const pageTitle = team?.name ? `${team?.name} - Projects` : undefined;
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");

  if (teamProjectIds?.length === 0) return <EmptyState type={EmptyStateType.TEAM_PROJECTS} />;

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
