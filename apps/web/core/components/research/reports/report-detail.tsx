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
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { JSONContent } from "@plane/types";
import { Input, ModalCore } from "@plane/ui";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
import { getResearchErrorKey } from "@/components/research/common/error-messages";
import { ResearchReportAttachments } from "@/components/research/reports/report-attachments";
// hooks
import { useResearch } from "@/hooks/store/use-research";
import { useWorkspace } from "@/hooks/store/use-workspace";

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
  const { getWorkspaceBySlug } = useWorkspace();
  const [returnReason, setReturnReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<{ description_json: object; description_html: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | "submit" | "return" | "accept" | "visibility" | null>(
    null
  );

  const report = research.reports[reportId];
  const history = research.reportHistory[reportId] ?? [];
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";

  useEffect(() => {
    if (!report?.draft_content) return;
    setDraftContent({
      description_json: report.draft_content.description_json,
      description_html: report.draft_content.description_html,
    });
  }, [report?.draft_content]);

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
    if (pendingAction) return;
    setPendingAction("submit");
    try {
      await research.submitReport(
        workspaceSlug,
        reportId,
        report && !report.page_project && !report.project && draftContent ? draftContent : undefined
      );
      await Promise.all([research.fetchReport(workspaceSlug, reportId), research.fetchReports(workspaceSlug)]);
      setErrorKey(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.report_submitted.title"),
        message: t("research.feedback.report_submitted.message"),
      });
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setPendingAction(null);
    }
  }, [draftContent, pendingAction, report, reportId, research, t, workspaceSlug]);

  const handleReturn = useCallback(async () => {
    if (pendingAction || !returnReason.trim()) return;
    setPendingAction("return");
    try {
      await research.returnReport(workspaceSlug, reportId, returnReason.trim());
      await Promise.all([research.fetchReport(workspaceSlug, reportId), research.fetchReports(workspaceSlug)]);
      setReturnReason("");
      setShowReturn(false);
      setErrorKey(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.report_returned.title"),
        message: t("research.feedback.report_returned.message"),
      });
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setPendingAction(null);
    }
  }, [pendingAction, reportId, research, returnReason, t, workspaceSlug]);

  const handleAccept = useCallback(async () => {
    if (pendingAction) return;
    setPendingAction("accept");
    try {
      await research.acceptReport(workspaceSlug, reportId);
      await Promise.all([research.fetchReport(workspaceSlug, reportId), research.fetchReports(workspaceSlug)]);
      setErrorKey(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.report_accepted.title"),
        message: t("research.feedback.report_accepted.message"),
      });
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setPendingAction(null);
    }
  }, [pendingAction, reportId, research, t, workspaceSlug]);

  const handleSaveDraft = useCallback(async () => {
    if (!draftContent || pendingAction) return;
    setPendingAction("save");
    try {
      await research.saveReportDraft(workspaceSlug, reportId, draftContent);
      await research.fetchReport(workspaceSlug, reportId);
      setErrorKey(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("research.feedback.draft_saved.title"),
        message: t("research.feedback.draft_saved.message"),
      });
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    } finally {
      setPendingAction(null);
    }
  }, [draftContent, pendingAction, reportId, research, t, workspaceSlug]);

  const handleVisibility = useCallback(
    async (visibility: TReportVisibility) => {
      if (pendingAction || report?.visibility === visibility) return;
      setPendingAction("visibility");
      try {
        await research.updateReportVisibility(workspaceSlug, reportId, visibility);
        await research.fetchReports(workspaceSlug);
        setErrorKey(null);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("research.feedback.visibility_updated.title"),
          message: t("research.feedback.visibility_updated.message"),
        });
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      } finally {
        setPendingAction(null);
      }
    },
    [pendingAction, report?.visibility, reportId, research, t, workspaceSlug]
  );

  if (!report) {
    return <p className="p-5 text-13 text-tertiary">{t("research.common.loading")}</p>;
  }

  const isAuthor = report.owner === research.identity?.user.id;
  const pageProject = report.page_project ?? report.project;
  const canOpenDraft = isAuthor && Boolean(pageProject && report.page);
  const officialContent = !isAuthor ? report.official_content : null;
  const officialDocument = officialContent
    ? Object.keys(officialContent.description_json).length > 0
      ? (officialContent.description_json as JSONContent)
      : officialContent.description_html || "<p></p>"
    : null;
  const standaloneDraftDocument = draftContent
    ? Object.keys(draftContent.description_json).length > 0
      ? (draftContent.description_json as JSONContent)
      : draftContent.description_html || "<p></p>"
    : null;

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
          <p className="mt-1 text-11 text-tertiary">{t(`research.reports.next_step.${report.status.toLowerCase()}`)}</p>
        </div>
        <div className="flex items-center gap-2">
          {canOpenDraft && pageProject && (
            <Link
              href={`/${workspaceSlug}/projects/${pageProject}/pages/${report.page}`}
              className="rounded-md border border-strong px-2 py-1 text-12 text-secondary hover:bg-surface-2"
            >
              {t("research.reports.open_body")}
            </Link>
          )}
          {report.can_edit && (
            <Button
              variant="primary"
              size="sm"
              loading={pendingAction === "submit"}
              disabled={pendingAction !== null}
              onClick={() => void handleSubmit()}
            >
              {t("research.reports.submit")}
            </Button>
          )}
          {report.can_review && report.status === "SUBMITTED" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                disabled={pendingAction !== null}
                onClick={() => setShowReturn(true)}
              >
                {t("research.reports.return")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={pendingAction === "accept"}
                disabled={pendingAction !== null}
                onClick={() => void handleAccept()}
              >
                {t("research.reports.accept")}
              </Button>
            </>
          )}
        </div>
      </div>

      {isAuthor && !pageProject && standaloneDraftDocument && workspaceId && (
        <section className="rounded-lg border border-subtle bg-surface-1 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-13 font-medium text-primary">{t("research.reports.draft_content")}</h3>
            {report.can_edit && (
              <Button
                variant="secondary"
                size="sm"
                loading={pendingAction === "save"}
                disabled={pendingAction !== null}
                onClick={() => void handleSaveDraft()}
              >
                {t("research.common.save")}
              </Button>
            )}
          </div>
          {report.can_edit ? (
            <DocumentEditor
              key={`${report.id}:${report.status}`}
              editable
              containerClassName="min-h-64 border-none !p-0"
              editorClassName="pl-0"
              id={`${report.id}-draft`}
              value={standaloneDraftDocument}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              disabledExtensions={["image", "issue-embed"]}
              searchMentionCallback={async () => ({})}
              uploadFile={async () => {
                throw new Error("Use report attachments for files.");
              }}
              duplicateFile={async () => {
                throw new Error("Use report attachments for files.");
              }}
              onChange={(descriptionJson: object, descriptionHtml: string) =>
                setDraftContent({
                  description_json: descriptionJson,
                  description_html: descriptionHtml,
                })
              }
            />
          ) : (
            <DocumentEditor
              key={`${report.id}:${report.status}`}
              editable={false}
              containerClassName="min-h-64 border-none !p-0"
              editorClassName="pl-0"
              id={`${report.id}-draft`}
              value={standaloneDraftDocument}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              disabledExtensions={["image", "issue-embed"]}
            />
          )}
        </section>
      )}

      {!isAuthor && (
        <section className="rounded-lg border border-subtle bg-surface-1 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-13 font-medium text-primary">{t("research.reports.official_content")}</h3>
            {officialContent && (
              <span className="text-11 text-tertiary">
                {t("research.reports.official_version", { version: officialContent.version_no })}
              </span>
            )}
          </div>
          {officialContent && officialDocument ? (
            workspaceId ? (
              <DocumentEditor
                key={`${report.id}:${officialContent.version_no}`}
                editable={false}
                containerClassName="mt-3 border-none !p-0"
                editorClassName="pl-0"
                id={`${report.id}-official-${officialContent.version_no}`}
                value={officialDocument}
                projectId={pageProject ?? undefined}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
              />
            ) : (
              <p className="mt-3 text-12 whitespace-pre-wrap text-secondary">{officialContent.description_stripped}</p>
            )
          ) : (
            <p className="mt-3 text-12 text-tertiary">{t("research.reports.no_official_content")}</p>
          )}
        </section>
      )}

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.reports.visibility")}</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {REPORT_VISIBILITIES.filter((visibility) => visibility !== "CUSTOM").map((visibility) => (
            <button
              key={visibility}
              type="button"
              disabled={!report.can_edit || pendingAction !== null}
              className={`rounded-md border px-2 py-1 text-12 disabled:cursor-not-allowed disabled:opacity-50 ${
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

      <ModalCore isOpen={showReturn} handleClose={() => pendingAction === null && setShowReturn(false)}>
        <section className="bg-surface-1 p-5">
          <h3 className="text-13 font-medium text-primary">{t("research.reports.return_reason")}</h3>
          <p className="mt-1 text-11 text-secondary">
            {t("research.reports.return_target", {
              from: t(REPORT_STATUS_LABELS.SUBMITTED),
              to: t(REPORT_STATUS_LABELS.NEEDS_REVISION),
            })}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input
              aria-label={t("research.reports.return_reason")}
              className="min-w-0 flex-1 sm:!w-96 sm:flex-none"
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              placeholder={t("research.reports.return_placeholder")}
            />
            <Button
              variant="primary"
              size="sm"
              loading={pendingAction === "return"}
              disabled={pendingAction !== null || !returnReason.trim()}
              onClick={() => void handleReturn()}
            >
              {t("research.common.confirm")}
            </Button>
            <Button variant="ghost" size="sm" disabled={pendingAction !== null} onClick={() => setShowReturn(false)}>
              {t("research.common.cancel")}
            </Button>
          </div>
        </section>
      </ModalCore>

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
