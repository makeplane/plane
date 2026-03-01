/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Outlet } from "react-router";
import { ETeamspaceNavigationItem } from "@plane/constants";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
// plane web components
import { TeamspaceDetailHeader } from "@/components/teamspaces/headers/detail-header";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
import type { Route } from "./+types/layout";

export default function TeamspaceWorkItemsLayout({ params }: Route.ComponentProps) {
  const { teamspaceId } = params;
  // store hooks
  const { getTeamspaceById } = useTeamspaces();
  // derived values
  const currentTeam = getTeamspaceById(teamspaceId);
  const pageTitle = currentTeam?.name ? `Teamspace ${currentTeam?.name} - Issues` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <AppHeader header={<TeamspaceDetailHeader selectedNavigationKey={ETeamspaceNavigationItem.ISSUES} />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
