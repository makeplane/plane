/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
import { ResearchProjectNav } from "@/components/research/navigation/research-project-nav";
import { StageDetail } from "@/components/research/stages/stage-detail";
import { StageTimeline } from "@/components/research/stages/stage-timeline";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
  stageCode?: string;
};

/**
 * Project stage overview: the four-stage timeline plus the detail of the
 * selected stage. Access is enforced by the backend; the switch only hides
 * entry points (P1-UI-07).
 */
export const StageOverview = observer(function StageOverview({ workspaceSlug, projectId, stageCode }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const stages = research.getProjectStages(workspaceSlug, projectId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      await research.fetchProjectStages(workspaceSlug, projectId);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [projectId, research, workspaceSlug]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId]);

  useEffect(() => {
    if (!stages.length) return;
    const preferred = stageCode ? stages.find((stage) => stage.stage === stageCode.toUpperCase()) : undefined;
    const active = stages.find((stage) => ["IN_PROGRESS", "SUBMITTED", "NEEDS_REVISION"].includes(stage.status));
    setSelectedId((current) => current ?? preferred?.id ?? active?.id ?? stages[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageCode, stages.length, research.identity]);

  const selected = stages.find((stage) => stage.id === selectedId) ?? null;

  if (errorKey) return <p className="p-5 text-13 text-danger-primary">{t(errorKey)}</p>;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ResearchProjectNav workspaceSlug={workspaceSlug} projectId={projectId} />
      <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
        <div className="flex items-center justify-between gap-2">
          <StageTimeline stages={stages} selectedStageId={selectedId} onSelect={(stage) => setSelectedId(stage.id)} />
          {!stages.length && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => void research.createProjectStages(workspaceSlug, projectId)}
            >
              {t("research.stages.initialise")}
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-hidden rounded border border-subtle">
          {selected ? (
            <StageDetail
              key={selected.id}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              stage={selected}
              isWorkspaceAdmin={research.isWorkspaceAdmin}
            />
          ) : (
            <p className="p-5 text-13 text-tertiary">{t("research.stages.empty")}</p>
          )}
        </div>
      </div>
    </div>
  );
});
