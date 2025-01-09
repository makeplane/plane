"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { ETeamNavigationItem } from "@plane/constants";
// components
import { AppHeader, ContentWrapper, PageHead } from "@/components/core";
// plane web components
import { TeamDetailHeader } from "@/plane-web/components/teams/headers/detail-header";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

export default function TeamIssuesLayout({ children }: { children: ReactNode }) {
  const { teamId } = useParams();
  // store hooks
  const { getTeamById } = useTeams();
  // derived values
  const currentTeam = getTeamById(teamId?.toString());
  const pageTitle = currentTeam?.name ? `Team ${currentTeam?.name} - Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <AppHeader header={<TeamDetailHeader selectedNavigationKey={ETeamNavigationItem.ISSUES} />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
