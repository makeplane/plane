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

// components
import { PageHead } from "@/components/core/page-title";
// plane web components
import { TeamspaceProjectWorkLayoutRoot } from "@/components/issues/issue-layouts/roots/teamspace-project-root";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";
import type { Route } from "./+types/page";

function TeamspaceProjectDetailPage({ params }: Route.ComponentProps) {
  const { teamspaceId } = params;
  // store
  const { getTeamspaceById } = useTeamspaces();

  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const pageTitle = teamspace?.name ? `${teamspace?.name} - Work items` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full">
        <TeamspaceProjectWorkLayoutRoot />
      </div>
    </>
  );
}

export default TeamspaceProjectDetailPage;
