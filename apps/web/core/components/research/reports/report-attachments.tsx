/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  reportId: string;
  editable: boolean;
};

/**
 * Attachments (PDF) and Markdown body import for a report (P0-FILE-01 ~
 * P0-FILE-07). Uploads go straight to S3 through a presigned POST so the
 * server never buffers the file.
 */
export const ResearchReportAttachments = observer(function ResearchReportAttachments({
  workspaceSlug,
  reportId,
  editable,
}: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const [markdownDraft, setMarkdownDraft] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const attachments = research.reportAttachments[reportId] ?? [];

  useEffect(() => {
    void research.fetchReportAttachments(workspaceSlug, reportId).catch((error) => {
      setErrorKey(getResearchErrorKey(error));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, reportId]);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        await research.uploadReportAttachment(workspaceSlug, reportId, {
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
          size: file.size,
          body: file,
        });
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [reportId, research, workspaceSlug]
  );

  const handleMarkdownFile = useCallback(async (file: File) => {
    const text = await file.text();
    setMarkdownDraft(text);
  }, []);

  const handleImport = useCallback(
    async (content: string, fileName?: string) => {
      if (!content.trim()) return;
      try {
        const localImages = await research.importReportMarkdown(workspaceSlug, reportId, {
          content,
          file_name: fileName,
        });
        setWarning(localImages.length ? t("research.attachments.local_images", { count: localImages.length }) : null);
        setMarkdownDraft("");
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [reportId, research, t, workspaceSlug]
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      try {
        await research.deleteReportAttachment(workspaceSlug, reportId, attachmentId);
        setErrorKey(null);
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [reportId, research, workspaceSlug]
  );

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-subtle bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-13 font-medium text-primary">{t("research.attachments.title")}</h3>
        {editable && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              {t("research.attachments.upload_pdf")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => markdownInputRef.current?.click()}>
              {t("research.attachments.pick_markdown")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
            <input
              ref={markdownInputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleMarkdownFile(file);
                event.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}
      {warning && (
        <div className="rounded-md border border-subtle bg-surface-2 px-3 py-2 text-12 text-secondary">{warning}</div>
      )}

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.attachments.columns.name")}</th>
            <th className="font-normal py-2">{t("research.attachments.columns.kind")}</th>
            <th className="font-normal py-2">{t("research.attachments.columns.size")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {attachments.map((attachment) => (
            <tr key={attachment.id} className="border-b border-subtle/60">
              <td className="py-2 text-secondary">{attachment.file_name}</td>
              <td className="py-2 text-tertiary">{attachment.kind}</td>
              <td className="py-2 text-tertiary">{Math.round(attachment.file_size / 1024)} KB</td>
              <td className="py-2 text-right">
                <a
                  className="mr-3 text-accent-primary"
                  href={`/api/research/workspaces/${workspaceSlug}/reports/${reportId}/attachments/${attachment.id}/`}
                >
                  {t("research.attachments.download")}
                </a>
                {editable && (
                  <Button variant="ghost" size="sm" onClick={() => void handleDelete(attachment.id)}>
                    {t("research.common.delete")}
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {attachments.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-center text-tertiary">
                {t("research.attachments.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editable && (
        <div className="flex flex-col gap-2 rounded-md border border-subtle bg-surface-2 p-3">
          <span className="text-12 text-secondary">{t("research.attachments.markdown_hint")}</span>
          <textarea
            className="font-mono h-32 w-full rounded-md border border-subtle bg-surface-1 p-2 text-12 text-primary"
            value={markdownDraft}
            onChange={(event) => setMarkdownDraft(event.target.value)}
            placeholder="# 本周进展"
          />
          <div className="flex items-center gap-2">
            <Input
              className="!w-48"
              placeholder={t("research.attachments.file_name_placeholder")}
              id="research-markdown-file-name"
            />
            <Button variant="primary" size="sm" onClick={() => void handleImport(markdownDraft)}>
              {t("research.attachments.import")}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
});
