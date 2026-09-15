/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EXPERIMENT_STATUS_LABELS } from "@plane/constants";
import type { TExperimentStatus } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * Midterm progress board (P1-MID-04): aggregated references to experiments,
 * code, reports and literature. Nothing here is editable - the source objects
 * keep their own permissions and states.
 */
export const StageProgressPanel = observer(function StageProgressPanel({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const progress = research.projectProgress[projectId];
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    await research.fetchProjectProgress(workspaceSlug, projectId).catch(() => undefined);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded || !progress) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-13 font-medium text-primary">{t("research.stages.progress.title")}</h3>
      <div className="flex flex-wrap gap-3 text-12 text-secondary">
        <span>
          {t("research.stages.progress.experiments", {
            total: progress.experiments.total,
            completed: progress.experiments.completed,
          })}
        </span>
        <span>
          {t("research.stages.progress.code", {
            repositories: progress.code.repositories.length,
            artifacts: progress.code.artifact_count,
          })}
        </span>
        <span>{t("research.stages.progress.literature", { count: progress.literature.included })}</span>
        <span>{t("research.stages.progress.reports", { count: progress.reports.count })}</span>
      </div>

      {progress.experiments.unexplained.length > 0 && (
        <p className="text-12 text-danger-primary">
          {t("research.stages.progress.unexplained", { count: progress.experiments.unexplained.length })}
        </p>
      )}

      <div className="flex flex-col gap-1">
        {progress.experiments.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-subtle px-2 py-1.5 text-12"
          >
            <span className="text-primary">{`#${item.sequence_no} ${item.title}`}</span>
            <span className="flex items-center gap-2 text-11 text-tertiary">
              <span className="rounded bg-surface-2 px-1.5 py-0.5">
                {t(EXPERIMENT_STATUS_LABELS[item.status as TExperimentStatus] ?? item.status)}
              </span>
              {item.status_note && <span>{item.status_note}</span>}
            </span>
          </div>
        ))}
      </div>
      <p className="text-11 text-tertiary">{t("research.stages.progress.read_only_hint")}</p>
    </div>
  );
});
