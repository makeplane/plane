/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  AMENDMENT_STATUS_LABELS,
  EXPERIMENT_ASSET_SYSTEM_LABELS,
  EXPERIMENT_SOURCE_LABELS,
  EXPERIMENT_STATUS_LABELS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  recordId: string;
  currentUserId?: string;
};

/**
 * Record detail: fields with the lock state, amendment diff and approver
 * actions, external asset references and the immutable version history.
 */
export const ExperimentDetail = observer(function ExperimentDetail({ workspaceSlug, recordId, currentUserId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const record = research.experiments[recordId];
  const versions = research.experimentVersions[recordId] ?? [];
  const amendments = research.experimentAmendments[recordId] ?? [];
  const assets = research.experimentAssets[recordId] ?? [];
  const [result, setResult] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [amendReason, setAmendReason] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const detail = await research.fetchExperiment(workspaceSlug, recordId);
      setResult(detail.result);
      setStatusNote(detail.status_note);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (errorKey) return <p className="p-5 text-13 text-danger-primary">{t(errorKey)}</p>;
  if (!record) return null;

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await load();
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-14 font-medium text-primary">{`#${record.sequence_no} ${record.title}`}</h2>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-secondary">
            {t(EXPERIMENT_STATUS_LABELS[record.status])}
          </span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-tertiary">
            {t(EXPERIMENT_SOURCE_LABELS[record.source])}
          </span>
          <span className="text-11 text-tertiary">
            {t("research.experiments.version", { version: record.current_version_no })}
          </span>
          {record.status_note === "pending_source_sync" && (
            <span className="rounded bg-warning-subtle px-1.5 py-0.5 text-11 text-warning-primary">
              {t("research.experiments.pending_source")}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {record.status === "PLANNED" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                void run(() => research.updateExperimentStatus(workspaceSlug, recordId, { status: "RUNNING" }))
              }
            >
              {t("research.experiments.start")}
            </Button>
          )}
          {record.status === "RUNNING" && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  void run(() => research.updateExperimentStatus(workspaceSlug, recordId, { status: "COMPLETED" }))
                }
              >
                {t("research.experiments.complete")}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void run(() =>
                    research.updateExperimentStatus(workspaceSlug, recordId, {
                      status: "FAILED",
                      failure_reason: "reported as failed",
                    })
                  )
                }
              >
                {t("research.experiments.fail")}
              </Button>
            </>
          )}
          {!record.submitted_at && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => void run(() => research.submitExperiment(workspaceSlug, recordId))}
            >
              {t("research.experiments.submit")}
            </Button>
          )}
          {record.submitted_at && ["COMPLETED", "FAILED", "CANCELLED"].includes(record.status) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void run(() => research.archiveExperiment(workspaceSlug, recordId))}
            >
              {t("research.experiments.archive")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-12">
        <div className="flex flex-col gap-1 rounded border border-subtle p-2">
          <span className="text-tertiary">{t("research.experiments.fields.molecular_system")}</span>
          <span className="text-primary">{record.molecular_system || "-"}</span>
          <span className="text-tertiary">{t("research.experiments.fields.method")}</span>
          <span className="text-primary">{record.method || "-"}</span>
          <span className="text-tertiary">{t("research.experiments.fields.hypothesis")}</span>
          <span className="text-primary">{record.hypothesis || "-"}</span>
        </div>
        <div className="flex flex-col gap-1 rounded border border-subtle p-2">
          <span className="text-tertiary">{t("research.experiments.fields.result")}</span>
          <textarea
            className="min-h-16 rounded border border-subtle bg-surface-1 p-2 text-12 text-primary disabled:opacity-60"
            value={result}
            disabled={!record.can_edit}
            onChange={(event) => setResult(event.target.value)}
          />
          <span className="text-tertiary">{t("research.experiments.fields.status_note")}</span>
          <Input
            value={statusNote}
            disabled={!record.can_edit}
            onChange={(event) => setStatusNote(event.target.value)}
          />
          {record.can_edit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                void run(() => research.updateExperiment(workspaceSlug, recordId, { result, status_note: statusNote }))
              }
            >
              {t("research.common.save")}
            </Button>
          )}
          {!record.can_edit && <p className="text-11 text-tertiary">{t("research.experiments.read_only_hint")}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-13 font-medium text-primary">{t("research.experiments.amendments_title")}</h3>
        {record.submitted_at && (
          <div className="flex items-center gap-2">
            <Input
              className="!w-64"
              value={amendReason}
              placeholder={t("research.experiments.amendment_reason")}
              onChange={(event) => setAmendReason(event.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!amendReason.trim()}
              onClick={() =>
                void run(() =>
                  research.createAmendment(workspaceSlug, recordId, {
                    reason: amendReason.trim(),
                    change_set: [{ field: "result", new: result }],
                  })
                )
              }
            >
              {t("research.experiments.request_amendment")}
            </Button>
          </div>
        )}
        {amendments.map((amendment) => (
          <div key={amendment.id} className="flex flex-col gap-1 rounded border border-subtle px-2 py-1.5 text-12">
            <div className="flex items-center justify-between gap-2">
              <span className="text-primary">
                {t(AMENDMENT_STATUS_LABELS[amendment.status])}
                {amendment.requested_by_detail ? ` · ${amendment.requested_by_detail.display_name}` : ""}
              </span>
              <span className="text-11 text-tertiary">{new Date(amendment.created_at).toLocaleString()}</span>
            </div>
            <span className="text-tertiary">{amendment.reason}</span>
            <div className="flex flex-col gap-0.5">
              {amendment.change_set.map((change) => (
                <span
                  key={`${amendment.id}-${change.field}-${JSON.stringify(change.new ?? "")}`}
                  className="text-11 text-secondary"
                >
                  {`${change.field}: ${JSON.stringify(change.old ?? "")} → ${JSON.stringify(change.new ?? "")}`}
                </span>
              ))}
            </div>
            {amendment.status === "PENDING" && (
              <div className="flex items-center gap-2">
                {amendment.requested_by === currentUserId && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void run(() => research.amendExperiment(workspaceSlug, amendment.id, "cancel"))}
                  >
                    {t("research.experiments.withdraw")}
                  </Button>
                )}
                {record.can_review && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        void run(() => research.amendExperiment(workspaceSlug, amendment.id, "approve", "approved"))
                      }
                    >
                      {t("research.experiments.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void run(() => research.amendExperiment(workspaceSlug, amendment.id, "reject", "rejected"))
                      }
                    >
                      {t("research.experiments.reject")}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-13 font-medium text-primary">{t("research.experiments.assets_title")}</h3>
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between gap-2 rounded border border-subtle px-2 py-1.5 text-12"
          >
            <span className="text-primary">{asset.display_name}</span>
            <span className="flex items-center gap-2 text-11 text-tertiary">
              <span className="rounded bg-surface-2 px-1.5 py-0.5">
                {t(EXPERIMENT_ASSET_SYSTEM_LABELS[asset.source_system] ?? asset.source_system)}
              </span>
              {asset.external_url && (
                <a
                  className="text-accent-primary hover:underline"
                  href={asset.external_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("research.experiments.open_source")}
                </a>
              )}
              {!asset.last_verified_at && (
                <span className="rounded bg-warning-subtle px-1.5 py-0.5 text-warning-primary">
                  {t("research.experiments.pending_source")}
                </span>
              )}
            </span>
          </div>
        ))}
        {!assets.length && <p className="text-12 text-tertiary">{t("research.experiments.no_assets")}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-13 font-medium text-primary">{t("research.experiments.versions_title")}</h3>
        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between gap-2 rounded border border-subtle px-2 py-1 text-12"
          >
            <span className="text-primary">
              {t("research.experiments.version", { version: version.version_no })}
              {` · ${version.change_source}`}
            </span>
            <span className="text-11 text-tertiary">{new Date(version.created_at).toLocaleString()}</span>
          </div>
        ))}
        {!versions.length && <p className="text-12 text-tertiary">{t("research.experiments.no_versions")}</p>}
      </div>
    </div>
  );
});
