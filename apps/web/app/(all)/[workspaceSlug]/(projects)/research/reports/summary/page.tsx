/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { ResearchReportSummaryBoard } from "@/components/research/reports/report-summary-board";

function WorkspaceResearchSummaryPage() {
  const { workspaceSlug } = useParams();
  if (!workspaceSlug) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.summary"
      descriptionKey="research.summary.description"
      section="reports"
      navKey="summary"
    >
      <ResearchReportSummaryBoard workspaceSlug={workspaceSlug} />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchSummaryPage);
