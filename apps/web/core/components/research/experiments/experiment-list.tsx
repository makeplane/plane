/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EXPERIMENT_SOURCE_LABELS, EXPERIMENT_STATUSES, EXPERIMENT_STATUS_LABELS } from "@plane/constants";
import type { TExperimentStatus } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { ExperimentDetail } from "@/components/research/experiments/experiment-detail";
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";
import { useUser } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const STATUS_TONES: Record<TExperimentStatus, string> = {
  PLANNED: "bg-surface-2 text-tertiary",
  RUNNING: "bg-accent-subtle text-accent-primary",
  COMPLETED: "bg-success-subtle text-success-primary",
  FAILED: "bg-danger-subtle text-danger-primary",
  CANCELLED: "bg-surface-2 text-secondary",
  ARCHIVED: "bg-surface-2 text-tertiary",
};

/** Experiment list with the per-record detail beside it (§6.2, P1-UI-04). */
export const ExperimentList = observer(function ExperimentList({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const { data: currentUser } = useUser();
  const records = research.getExperiments(workspaceSlug, projectId);
  const [statusFilter, setStatusFilter] = useState("");
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const loaded = await research.fetchExperiments(
          workspaceSlug,
          projectId,
          statusFilter ? { status: statusFilter } : {}
        );
        setSelectedId((current) => current ?? loaded[0]?.id ?? null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, statusFilter]);

  const selected = records.find((record) => record.id === selectedId) ?? null;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex w-96 flex-col gap-2 overflow-y-auto border-r border-subtle p-3">
        <div className="flex items-center gap-2">
          <Input
            className="!w-40"
            value={title}
            placeholder={t("research.experiments.title_placeholder")}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button
            size="sm"
            variant="primary"
            disabled={!title.trim()}
            onClick={async () => {
              try {
                const record = await research.createExperiment(workspaceSlug, projectId, { title: title.trim() });
                setTitle("");
                setSelectedId(record.id);
              } catch (error) {
                setErrorKey(getResearchErrorKey(error));
              }
            }}
          >
            {t("research.experiments.create")}
          </Button>
        </div>
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">{t("research.experiments.all_statuses")}</option>
          {EXPERIMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(EXPERIMENT_STATUS_LABELS[status])}
            </option>
          ))}
        </select>
        {errorKey && <p className="text-12 text-danger-primary">{t(errorKey)}</p>}
        <div className="flex flex-col gap-1">
          {records.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => setSelectedId(record.id)}
              className={`flex flex-col gap-1 rounded border px-2 py-1.5 text-left ${
                record.id === selectedId ? "border-accent-strong bg-surface-2" : "border-subtle"
              }`}
            >
              <span className="text-12 text-primary">{`#${record.sequence_no} ${record.title}`}</span>
              <span className="flex items-center gap-1 text-11">
                <span className={`rounded px-1.5 py-0.5 ${STATUS_TONES[record.status]}`}>
                  {t(EXPERIMENT_STATUS_LABELS[record.status])}
                </span>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 text-tertiary">
                  {t(EXPERIMENT_SOURCE_LABELS[record.source])}
                </span>
              </span>
            </button>
          ))}
          {!records.length && <p className="text-12 text-tertiary">{t("research.experiments.empty")}</p>}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ExperimentDetail
            key={selected.id}
            workspaceSlug={workspaceSlug}
            recordId={selected.id}
            currentUserId={currentUser?.id}
          />
        ) : (
          <p className="p-5 text-13 text-tertiary">{t("research.experiments.select_hint")}</p>
        )}
      </div>
    </div>
  );
});
