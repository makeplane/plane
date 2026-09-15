/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { ExperimentList } from "@/components/research/experiments/experiment-list";
import { ResearchProjectNav } from "@/components/research/navigation/research-project-nav";

function WorkspaceResearchProjectExperimentsPage() {
  const { workspaceSlug, projectId } = useParams();
  if (!workspaceSlug || !projectId) return null;

  return (
    <ResearchPageShell
      titleKey="research.nav.experiments"
      descriptionKey="research.experiments.description"
      section="experiments"
    >
      <div className="flex h-full flex-col overflow-hidden">
        <ResearchProjectNav workspaceSlug={workspaceSlug} projectId={projectId} />
        <div className="flex-1 overflow-hidden">
          <ExperimentList workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      </div>
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchProjectExperimentsPage);
