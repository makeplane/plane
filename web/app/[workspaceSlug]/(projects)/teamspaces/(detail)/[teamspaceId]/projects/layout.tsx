"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { ETeamspaceNavigationItem } from "@plane/constants";
// components
import { AppHeader, ContentWrapper, PageHead } from "@/components/core";
// plane web components
import { TeamDetailHeader } from "@/plane-web/components/teamspaces/headers/detail-header";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

export default function TeamspaceProjectsLayout({ children }: { children: ReactNode }) {
  const { teamspaceId } = useParams();
  // store hooks
  const { getTeamspaceById } = useTeamspaces();
  // derived values
  const currentTeam = getTeamspaceById(teamspaceId?.toString());
  const pageTitle = currentTeam?.name ? `Teamspace ${currentTeam?.name} - Projects` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <AppHeader header={<TeamDetailHeader selectedNavigationKey={ETeamspaceNavigationItem.PROJECTS} />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
