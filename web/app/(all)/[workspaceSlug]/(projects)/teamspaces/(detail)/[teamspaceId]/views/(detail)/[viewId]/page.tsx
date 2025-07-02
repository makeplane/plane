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
import { TeamspaceViewLayoutRoot } from "@/plane-web/components/issues/issue-layouts/roots/teamspace-view-layout-root";
// plane web hooks
import { useTeamspaces, useTeamspaceViews } from "@/plane-web/hooks/store";
// assets
import emptyView from "@/public/empty-state/view.svg";

const TeamspaceViewWorkItemsPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, teamspaceId, viewId } = useParams();
  // store hooks
  const { getTeamspaceById } = useTeamspaces();
  const { fetchTeamspaceViewDetails, getViewById } = useTeamspaceViews();
  // derived values
  const teamspaceView = teamspaceId && viewId ? getViewById(teamspaceId.toString(), viewId.toString()) : undefined;
  const teamspace = teamspaceId ? getTeamspaceById(teamspaceId.toString()) : undefined;
  const pageTitle = teamspace?.name && teamspaceView?.name ? `${teamspace?.name} - ${teamspaceView?.name}` : undefined;
  // fetch teamspace view details
  const { error } = useSWR(
    workspaceSlug && teamspaceId && viewId ? `TEAMSPACE_VIEW_DETAILS_${viewId.toString()}` : null,
    workspaceSlug && teamspaceId && viewId
      ? () => fetchTeamspaceViewDetails(workspaceSlug.toString(), teamspaceId.toString(), viewId.toString())
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
          onClick: () => router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/views`),
        }}
      />
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <TeamspaceViewLayoutRoot />
    </>
  );
});

export default TeamspaceViewWorkItemsPage;
