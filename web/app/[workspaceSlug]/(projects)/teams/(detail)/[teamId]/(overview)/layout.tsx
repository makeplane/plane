"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
// components
import { AppHeader, ContentWrapper, PageHead } from "@/components/core";
// plane web components
import { TeamDetailHeader } from "@/plane-web/components/teams/headers/detail-header";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";
// plane web types
import { ETeamNavigationItem } from "@/plane-web/types";

export default function TeamOverviewLayout({ children }: { children: ReactNode }) {
  const { teamId } = useParams();
  // store hooks
  const { getTeamById } = useTeams();
  // derived values
  const currentTeam = getTeamById(teamId?.toString());
  const pageTitle = currentTeam?.name ? `Team ${currentTeam?.name} - Overview` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <AppHeader header={<TeamDetailHeader selectedNavigationKey={ETeamNavigationItem.OVERVIEW} />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
