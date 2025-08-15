"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { ETeamspaceNavigationItem } from "@plane/constants";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
// plane web components
import { TeamspaceDetailHeader } from "@/plane-web/components/teamspaces/headers/detail-header";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

export default function TeamspaceWorkItemsLayout({ children }: { children: ReactNode }) {
  const { teamspaceId } = useParams();
  // store hooks
  const { getTeamspaceById } = useTeamspaces();
  // derived values
  const currentTeam = getTeamspaceById(teamspaceId?.toString());
  const pageTitle = currentTeam?.name ? `Teamspace ${currentTeam?.name} - Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <AppHeader header={<TeamspaceDetailHeader selectedNavigationKey={ETeamspaceNavigationItem.ISSUES} />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
