/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { ResearchPiAggregateBoard } from "@/components/research/pi/pi-aggregate-board";

/**
 * Main PI workspace board: a read-only aggregate of the caller's subtree in
 * the public workspace (SYS-PI-01 ~ SYS-PI-05).
 */
function WorkspaceResearchDashboardPage() {
  const { workspaceSlug } = useParams();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell titleKey="research.nav.dashboard" descriptionKey="research.pi.description" navKey="dashboard">
      <ResearchPiAggregateBoard workspaceSlug={workspaceSlug} />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchDashboardPage);
