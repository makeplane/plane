"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web components
import { TeamViewLayoutRoot } from "@/plane-web/components/issues/issue-layouts/roots/team-view-layout-root";
// plane web hooks
import { useTeams, useTeamViews } from "@/plane-web/hooks/store";
// assets
import emptyView from "@/public/empty-state/view.svg";

const TeamViewIssuesPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, teamId, viewId } = useParams();
  // store hooks
  const { getTeamById } = useTeams();
  const { fetchTeamViewDetails, getViewById } = useTeamViews();
  // derived values
  const teamView = teamId && viewId ? getViewById(teamId.toString(), viewId.toString()) : undefined;
  const team = teamId ? getTeamById(teamId.toString()) : undefined;
  const pageTitle = team?.name && teamView?.name ? `${team?.name} - ${teamView?.name}` : undefined;
  // fetch team view details
  const { error } = useSWR(
    workspaceSlug && teamId && viewId ? `TEAM_VIEW_DETAILS_${viewId.toString()}` : null,
    workspaceSlug && teamId && viewId
      ? () => fetchTeamViewDetails(workspaceSlug.toString(), teamId.toString(), viewId.toString())
      : null
  );

  if (error) {
    return (
      <EmptyState
        image={emptyView}
        title="View does not exist"
        description="The view you are looking for does not exist or you don't have permission to view it."
        primaryButton={{
          text: "View other views",
          onClick: () => router.push(`/${workspaceSlug}/teams/${teamId}/views`),
        }}
      />
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <TeamViewLayoutRoot />
    </>
  );
});

export default TeamViewIssuesPage;
