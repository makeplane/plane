/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  REPORT_VISIBILITIES,
  REPORT_VISIBILITY_LABELS,
} from "@plane/constants";
import type { TReportVisibility } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
import { ResearchReportAttachments } from "@/components/research/reports/report-attachments";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  reportId: string;
};

/**
 * Report detail: metadata, workflow actions, review history and visibility
 * management. The body itself is edited through the linked Plane Page so the
 * shared editor and its versioning are reused (P0-UI-03).
 */
export const ResearchReportDetail = observer(function ResearchReportDetail({ workspaceSlug, reportId }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const report = research.reports[reportId];
  const history = research.reportHistory[reportId] ?? [];

  useEffect(() => {
    void (async () => {
      try {
        await research.fetchReport(workspaceSlug, reportId);
        await research.fetchReportHistory(workspaceSlug, reportId);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, reportId]);

  const handleSubmit = useCallback(async () => {
    try {
      await research.submitReport(workspaceSlug, reportId);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [reportId, research, workspaceSlug]);

  const handleReturn = useCallback(async () => {
    try {
      await research.returnReport(workspaceSlug, reportId, returnReason);
      setReturnReason("");
      setShowReturn(false);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [reportId, research, returnReason, workspaceSlug]);

  const handleAccept = useCallback(async () => {
    try {
      await research.acceptReport(workspaceSlug, reportId);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [reportId, research, workspaceSlug]);

  const handleVisibility = useCallback(
    async (visibility: TReportVisibility) => {
      try {
        await research.updateReportVisibility(workspaceSlug, reportId, visibility);
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [reportId, research, workspaceSlug]
  );

  if (!report) {
    return <p className="p-5 text-13 text-tertiary">{t("research.common.loading")}</p>;
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-14 font-medium text-primary">
            {report.period_key} · {t(REPORT_TYPE_LABELS[report.report_type])}
          </h2>
          <p className="mt-0.5 text-12 text-tertiary">
            {t(REPORT_STATUS_LABELS[report.status])} · {report.period_start} ~ {report.period_end}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${workspaceSlug}/projects/${report.project}/pages/${report.page}`}
            className="rounded-md border border-strong px-2 py-1 text-12 text-secondary hover:bg-surface-2"
          >
            {t("research.reports.open_body")}
          </Link>
          {report.can_edit && (
            <Button variant="primary" size="sm" onClick={() => void handleSubmit()}>
              {t("research.reports.submit")}
            </Button>
          )}
          {report.can_review && report.status === "SUBMITTED" && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowReturn(true)}>
                {t("research.reports.return")}
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleAccept()}>
                {t("research.reports.accept")}
              </Button>
            </>
          )}
        </div>
      </div>

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.reports.visibility")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {REPORT_VISIBILITIES.filter((visibility) => visibility !== "CUSTOM").map((visibility) => (
            <button
              key={visibility}
              type="button"
              disabled={!report.can_edit && !report.can_review}
              className={`rounded-md border px-2 py-1 text-12 ${
                report.visibility === visibility
                  ? "border-accent-primary text-accent-primary"
                  : "border-subtle text-tertiary hover:text-secondary"
              }`}
              onClick={() => void handleVisibility(visibility)}
            >
              {t(REPORT_VISIBILITY_LABELS[visibility])}
            </button>
          ))}
        </div>
        <p className="mt-2 text-11 text-tertiary">{t("research.reports.visibility_hint")}</p>
      </section>

      {showReturn && (
        <section className="rounded-lg border border-subtle bg-surface-1 p-4">
          <h3 className="text-13 font-medium text-primary">{t("research.reports.return_reason")}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Input
              className="!w-96"
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              placeholder={t("research.reports.return_placeholder")}
            />
            <Button variant="primary" size="sm" onClick={() => void handleReturn()}>
              {t("research.common.confirm")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowReturn(false)}>
              {t("research.common.cancel")}
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.reports.history")}</h3>
        <ol className="mt-3 flex flex-col gap-3">
          {history.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-0.5 border-l border-subtle pl-3">
              <span className="text-12 text-secondary">
                {entry.action} · {entry.from_status} → {entry.to_status}
              </span>
              <span className="text-11 text-tertiary">
                {entry.actor_detail?.display_name ?? entry.actor_detail?.email ?? entry.actor} ·{" "}
                {new Date(entry.created_at).toLocaleString()}
              </span>
              {entry.comment && <span className="text-12 text-secondary">{entry.comment}</span>}
            </li>
          ))}
          {history.length === 0 && <li className="text-12 text-tertiary">{t("research.reports.no_history")}</li>}
        </ol>
      </section>

      <ResearchReportAttachments
        workspaceSlug={workspaceSlug}
        reportId={reportId}
        editable={Boolean(report.can_edit)}
      />
    </div>
  );
});
