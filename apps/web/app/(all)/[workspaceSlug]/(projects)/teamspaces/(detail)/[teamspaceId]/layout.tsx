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
import useSWR from "swr";
import { useTeamspaces, useTeamspaceViews } from "@/plane-web/hooks/store";
// types
import type { Route } from "./+types/layout";

export default function TeamspaceDetailLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, teamspaceId } = params;
  // store hooks
  const { isCurrentUserMemberOfTeamspace, fetchTeamspaceDetails } = useTeamspaces();
  const { fetchTeamspaceViews } = useTeamspaceViews();
  // derived values
  const isTeamspaceMember = isCurrentUserMemberOfTeamspace(teamspaceId);

  // fetching teamspace details
  useSWR(
    isTeamspaceMember ? `WORKSPACE_TEAMSPACES_${workspaceSlug}_${teamspaceId}_${isTeamspaceMember}` : null,
    isTeamspaceMember ? () => fetchTeamspaceDetails(workspaceSlug, teamspaceId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch teamspace views
  useSWR(["teamspaceViews", workspaceSlug, teamspaceId], () => fetchTeamspaceViews(workspaceSlug, teamspaceId), {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return <Outlet />;
}
