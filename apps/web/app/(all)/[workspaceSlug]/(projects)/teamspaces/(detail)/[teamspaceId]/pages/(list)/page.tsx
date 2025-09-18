"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
// plane imports
import { TPageNavigationTabs } from "@plane/types";
// components
import { PageHead } from "@/components/core/page-title";
// plane web imports
import { TeamspacePagesListView } from "@/plane-web/components/teamspaces/pages/pages-list-view";
import { EPageStoreType, usePageStore, useTeamspaces } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.TEAMSPACE;

const TeamspacePagesPage = observer(() => {
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamSpaceId } = useParams();
  const searchParams = useSearchParams();

  const workspaceSlug = routerWorkspaceSlug!.toString();
  const teamspaceId = routerTeamSpaceId!.toString();

  // store hooks
  const { getTeamspaceById } = useTeamspaces();

  // derived values
  const currentTeamspace = getTeamspaceById(teamspaceId);
  const pageTitle = currentTeamspace?.name ? `Teamspace ${currentTeamspace?.name} - Pages` : undefined;

  if (!workspaceSlug || !teamspaceId) return <></>;

  // Get current page type (only public/archived for teamspaces)
  const currentPageType = (): TPageNavigationTabs => {
    const pageType = searchParams.get("type");
    if (pageType === "archived") return "archived";
    return "public"; // Default to public
  };

  return (
    <TeamspacePagesListView pageType={currentPageType()} teamspaceId={teamspaceId} workspaceSlug={workspaceSlug} />
  );
});

export default TeamspacePagesPage;
