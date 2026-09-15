/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
// components
import { ResearchPageShell } from "@/components/research/common/research-page-shell";
import { StageMaterialDetail } from "@/components/research/stages/stage-material-detail";

function WorkspaceResearchStageMaterialPage() {
  const { workspaceSlug, projectId, stageCode, materialId } = useParams();
  if (!workspaceSlug || !projectId || !stageCode || !materialId) return null;

  return (
    <ResearchPageShell
      titleKey="research.stages.material_title"
      descriptionKey="research.stages.material_description"
      section="stages"
    >
      <StageMaterialDetail
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        stageCode={stageCode}
        materialId={materialId}
      />
    </ResearchPageShell>
  );
}

export default observer(WorkspaceResearchStageMaterialPage);
