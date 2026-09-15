/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { STAGE_STATUS_LABELS, STAGE_TYPE_LABELS } from "@plane/constants";
import type { TStageGateItem, TStageInstance } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { StageActions } from "@/components/research/stages/stage-actions";
import { StageGateChecklist } from "@/components/research/stages/stage-gate-checklist";
import { StageMaterialList } from "@/components/research/stages/stage-material-list";
import { StageTransitionHistory } from "@/components/research/stages/stage-transition-history";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
  stage: TStageInstance;
  isWorkspaceAdmin: boolean;
};

type TErrorLike = { error_code?: string; message?: string; blockers?: TStageGateItem[] };

/**
 * One stage: gate checklist, material checklist, actions and immutable history
 * (P1-UI-02). Blockers are rendered item by item, never as a generic error.
 */
export const StageDetail = observer(function StageDetail({ workspaceSlug, projectId, stage, isWorkspaceAdmin }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [blockers, setBlockers] = useState<TStageGateItem[]>([]);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<"submit" | "pass">("submit");

  const materials = research.getStageMaterials(stage.id);
  const transitions = research.stageTransitions[stage.id] ?? [];
  const gate = phase === "submit" ? research.stageGate[stage.id] : undefined;
  const [passGate, setPassGate] = useState<Awaited<ReturnType<typeof research.fetchStageGate>> | undefined>();

  const load = useCallback(async () => {
    try {
      await research.fetchStage(workspaceSlug, stage.id);
      await Promise.all([
        research.fetchStageGate(workspaceSlug, stage.id, "submit"),
        research.fetchStageTransitions(workspaceSlug, stage.id),
        research.fetchStageMaterials(workspaceSlug, stage.id),
      ]);
      setErrorCode(null);
    } catch (error) {
      setErrorCode((error as TErrorLike)?.error_code ?? "generic");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.id, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const handle = useCallback(
    async (action: () => Promise<unknown>) => {
      setBlockers([]);
      setErrorCode(null);
      try {
        await action();
        await load();
      } catch (error) {
        const failure = error as TErrorLike;
        if (failure?.blockers?.length) setBlockers(failure.blockers);
        else setErrorCode(failure?.error_code ?? "generic");
        throw error;
      }
    },
    [load]
  );

  const showPassGate = useCallback(async () => {
    setPhase("pass");
    try {
      setPassGate(await research.fetchStageGate(workspaceSlug, stage.id, "pass"));
    } catch {
      setPassGate(undefined);
    }
  }, [research, stage.id, workspaceSlug]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-14 font-medium text-primary">{t(STAGE_TYPE_LABELS[stage.stage])}</h2>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-secondary">
            {t(STAGE_STATUS_LABELS[stage.status])}
          </span>
          {stage.attempt_count > 0 && (
            <span className="text-11 text-tertiary">
              {t("research.stages.attempts", { count: stage.attempt_count })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-11">
          <button
            type="button"
            className={`rounded px-2 py-0.5 ${phase === "submit" ? "bg-surface-2 text-primary" : "text-tertiary"}`}
            onClick={() => setPhase("submit")}
          >
            {t("research.stages.gate.phase_submit")}
          </button>
          <button
            type="button"
            className={`rounded px-2 py-0.5 ${phase === "pass" ? "bg-surface-2 text-primary" : "text-tertiary"}`}
            onClick={() => void showPassGate()}
          >
            {t("research.stages.gate.phase_pass")}
          </button>
        </div>
      </div>

      <StageActions
        stage={stage}
        isWorkspaceAdmin={isWorkspaceAdmin}
        onEnter={() => handle(() => research.enterStage(workspaceSlug, stage.id))}
        onSubmit={() => handle(() => research.submitStage(workspaceSlug, stage.id))}
        onReturn={(reason) => handle(() => research.returnStage(workspaceSlug, stage.id, reason))}
        onPass={() => handle(() => research.passStage(workspaceSlug, stage.id))}
        onReopen={(reason, confirm) => handle(() => research.reopenStage(workspaceSlug, stage.id, reason, confirm))}
      />

      {errorCode && <p className="text-12 text-danger-primary">{t(`research.errors.${errorCode}`)}</p>}

      {(blockers.length > 0 || gate) && (
        <div className="flex flex-col gap-2">
          <StageGateChecklist gate={phase === "pass" ? (passGate ?? undefined) : gate} />
          {blockers.length > 0 && (
            <div className="flex flex-col gap-1 rounded border border-danger-strong bg-danger-subtle px-2 py-1.5">
              <p className="text-12 text-danger-primary">{t("research.stages.blockers_title")}</p>
              {blockers.map((blocker) => (
                <p key={blocker.code} className="text-11 text-secondary">
                  {t(blocker.label_key)}
                  {blocker.missing?.length ? `: ${blocker.missing.join(", ")}` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <StageMaterialList
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        stageId={stage.id}
        stageCode={stage.stage}
        materials={materials}
        canEdit={Boolean(stage.is_editable)}
        onCreate={async (materialType) => {
          await research.createStageMaterial(workspaceSlug, stage.id, { material_type: materialType });
          await load();
        }}
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-13 font-medium text-primary">{t("research.stages.history_title")}</h3>
        <StageTransitionHistory transitions={transitions} />
      </div>
    </div>
  );
});
