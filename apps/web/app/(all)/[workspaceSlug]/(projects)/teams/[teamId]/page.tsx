/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { TeamPage } from "@/components/teams/team-page";
// local imports
import type { Route } from "./+types/page";

export default function WorkspaceTeamPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, teamId } = params;
  // remounts per team so the selected tab does not carry over
  return <TeamPage key={teamId} workspaceSlug={workspaceSlug} teamId={teamId} />;
}
