"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useProject } from "@/hooks/store";
// plane web imports
import {
  TeamspaceProjectsWithGroupingRoot,
  TeamspaceProjectsWithoutGroupingRoot,
} from "@/plane-web/components/teamspaces/projects";
import { useFlag, useTeamspaces, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const TeamspaceProjectsPage = observer(() => {
  const { workspaceSlug, teamspaceId } = useParams();
  // store hooks
  const { fetchProjects } = useProject();
  const { getTeamspaceById, getTeamspaceProjectIds } = useTeamspaces();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const teamspace = teamspaceId ? getTeamspaceById(teamspaceId.toString()) : undefined;
  const teamspaceProjectIds = teamspaceId ? getTeamspaceProjectIds(teamspaceId.toString()) : undefined;
  const pageTitle = teamspace?.name ? `${teamspace?.name} - Projects` : undefined;
  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");
  // fetching workspace projects
  useSWR(
    workspaceSlug ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (teamspaceProjectIds?.length === 0) return <EmptyState type={EmptyStateType.TEAM_PROJECTS} />;

  if (!teamspace) return null;
  return (
    <>
      <PageHead title={pageTitle} />
      {isProjectGroupingEnabled ? (
        <TeamspaceProjectsWithGroupingRoot workspaceSlug={workspaceSlug.toString()} />
      ) : (
        <TeamspaceProjectsWithoutGroupingRoot workspaceSlug={workspaceSlug.toString()} teamspace={teamspace} />
      )}
    </>
  );
});

export default TeamspaceProjectsPage;
