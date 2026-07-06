/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ChangeEvent } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { FileUp, Maximize2, Minimize2, Paperclip, Save, Send, X } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TMailTemplate } from "@plane/types";
import { useMail } from "@/hooks/store/use-mail";
import { splitRecipients } from "./helpers";
import { convertMailFileToHtml, isImportableMailFile } from "./mail-import";
import { MailRichText } from "./mail-rich-text";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const textToHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");

const htmlToText = (html: string) => {
  const node = document.createElement("div");
  node.innerHTML = html;
  return node.innerText.trim();
};

type TPendingAction = { kind: "template"; template: TMailTemplate } | { kind: "import"; html: string };

export const ComposeModal = observer(function ComposeModal() {
  const { t } = useTranslation();
  const mail = useMail();
  const draft = mail.composeDraft;
  const [expanded, setExpanded] = useState(false);
  const [pendingAction, setPendingAction] = useState<TPendingAction | null>(null);

  if (!mail.composeOpen) return null;

  const hasWrittenContent = () =>
    !!draft.subject.trim() || !!draft.body_text?.trim() || !!htmlToText(draft.body_html ?? "");

  const applyTemplate = (template: TMailTemplate) => {
    const bodyHtml = template.body_html || textToHtml(template.body_text);
    mail.updateComposeDraft({
      subject: template.subject || draft.subject,
      body_html: bodyHtml,
      body_text: template.body_text || htmlToText(bodyHtml),
    });
    setPendingAction(null);
  };

  const applyImport = (html: string) => {
    mail.updateComposeDraft({ body_html: html, body_text: htmlToText(html) });
    setPendingAction(null);
  };

  const selectTemplate = (template: TMailTemplate) => {
    if (hasWrittenContent()) {
      setPendingAction({ kind: "template", template });
      return;
    }
    applyTemplate(template);
  };

  const closeCompose = () => {
    setPendingAction(null);
    setExpanded(false);
    mail.closeCompose();
  };

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    try {
      await Promise.all(files.map((file) => mail.uploadAttachment(file)));
      event.target.value = "";
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.upload_error") });
    }
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isImportableMailFile(file.name)) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.import_unsupported") });
      return;
    }
    try {
      const html = await convertMailFileToHtml(file);
      if (hasWrittenContent()) {
        setPendingAction({ kind: "import", html });
      } else {
        applyImport(html);
      }
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.import_error") });
    }
  };

  const sendMessage = async () => {
    try {
      await mail.sendCompose();
      setPendingAction(null);
      setExpanded(false);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.compose.sent") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.send_error") });
    }
  };

  const saveDraft = async () => {
    try {
      await mail.saveDraft();
      setPendingAction(null);
      setExpanded(false);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.compose.draft_saved") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.draft_error") });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6">
      <section
        className={cn(
          "shadow-2xl flex max-h-[calc(100vh-48px)] max-w-[calc(100vw-48px)] overflow-hidden rounded-lg bg-white",
          expanded ? "h-[calc(100vh-48px)] w-[calc(100vw-48px)]" : "h-[680px] w-[920px]"
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 items-center justify-between border-b border-[var(--mail-border)] bg-[var(--mail-compose-header)] px-4 text-[var(--mail-compose-header-ink)]">
            <div className="text-sm font-medium">{t("mail.compose.new")}</div>
            <div className="flex items-center gap-1">
              <button
                className="grid size-8 place-items-center rounded hover:bg-white/10"
                type="button"
                title={expanded ? t("mail.compose.restore") : t("mail.compose.fullscreen")}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
              <button
                className="grid size-8 place-items-center rounded hover:bg-white/10"
                type="button"
                onClick={closeCompose}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="text-sm grid border-b border-[var(--mail-border)]">
            <label className="flex min-h-11 items-center gap-3 px-4">
              <span className="w-12 text-[var(--mail-muted)]">{t("mail.compose.to")}</span>
              <input
                className="min-w-0 flex-1 outline-none"
                value={draft.to.join(", ")}
                onChange={(event) => mail.updateComposeDraft({ to: splitRecipients(event.target.value) })}
              />
            </label>
            <label className="flex min-h-11 items-center gap-3 border-t border-[var(--mail-border)] px-4">
              <span className="w-12 text-[var(--mail-muted)]">{t("mail.compose.cc")}</span>
              <input
                className="min-w-0 flex-1 outline-none"
                value={(draft.cc ?? []).join(", ")}
                onChange={(event) => mail.updateComposeDraft({ cc: splitRecipients(event.target.value) })}
              />
            </label>
            <label className="flex min-h-11 items-center gap-3 border-t border-[var(--mail-border)] px-4">
              <span className="w-12 text-[var(--mail-muted)]">{t("mail.compose.subject")}</span>
              <input
                className="min-w-0 flex-1 outline-none"
                value={draft.subject}
                onChange={(event) => mail.updateComposeDraft({ subject: event.target.value })}
              />
            </label>
          </div>

          <MailRichText
            html={draft.body_html ?? ""}
            placeholder={t("mail.compose.body_placeholder")}
            onChange={({ html, text }) => mail.updateComposeDraft({ body_html: html, body_text: text })}
          />

          {!!draft.uploaded_attachments?.length && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--mail-border)] px-4 py-3">
              {draft.uploaded_attachments.map((attachment) => (
                <span
                  key={attachment.key}
                  className="text-xs rounded-md bg-[var(--mail-hover)] px-2 py-1 text-[var(--mail-ink)]"
                >
                  {attachment.filename}
                </span>
              ))}
            </div>
          )}

          <div className="flex h-14 items-center justify-between border-t border-[var(--mail-border)] px-4">
            <div className="flex items-center gap-1">
              <label className="mail-icon-button cursor-pointer" title={t("mail.compose.attach")}>
                <Paperclip className="size-4" />
                <input className="hidden" type="file" multiple onChange={uploadFiles} />
              </label>
              <label className="mail-icon-button cursor-pointer" title={t("mail.compose.import")}>
                <FileUp className="size-4" />
                <input
                  className="hidden"
                  type="file"
                  accept=".html,.htm,.md,.markdown,text/html,text/markdown"
                  onChange={importFile}
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button className="mail-secondary-button" type="button" onClick={saveDraft} disabled={mail.actionLoader}>
                <Save className="size-4" />
                {t("mail.compose.save_draft")}
              </button>
              <button
                className="mail-primary-button"
                type="button"
                onClick={sendMessage}
                disabled={mail.actionLoader || !draft.to.length}
              >
                <Send className="size-4" />
                {t("mail.compose.send")}
              </button>
            </div>
          </div>
        </div>

        <aside className="hidden w-[260px] flex-shrink-0 border-l border-[var(--mail-border)] bg-[var(--mail-bg)] p-4 lg:block">
          <div className="text-sm mb-3 font-semibold text-[var(--mail-ink)]">{t("mail.compose.templates")}</div>
          <div className="space-y-2">
            {mail.templates.length ? (
              mail.templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="text-sm w-full rounded-md border border-[var(--mail-border)] bg-white px-3 py-2 text-left hover:border-[var(--mail-accent)]"
                  onClick={() => selectTemplate(template)}
                >
                  <div className="font-medium text-[var(--mail-ink)]">{template.name}</div>
                  <div className="text-xs mt-1 line-clamp-2 text-[var(--mail-muted)]">{template.subject}</div>
                </button>
              ))
            ) : (
              <div className="text-sm text-[var(--mail-muted)]">{t("mail.compose.no_templates")}</div>
            )}
          </div>
        </aside>
      </section>
      {pendingAction && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 px-4">
          <div className="shadow-xl w-full max-w-[420px] rounded-lg border border-[var(--mail-border)] bg-[var(--mail-panel)] p-5">
            <h2 className="text-base font-semibold text-[var(--mail-ink)]">
              {pendingAction.kind === "template"
                ? t("mail.compose.template_replace_title")
                : t("mail.compose.import_replace_title")}
            </h2>
            <p className="text-sm mt-2 leading-6 text-[var(--mail-muted)]">
              {pendingAction.kind === "template"
                ? t("mail.compose.template_replace_description")
                : t("mail.compose.import_replace_description")}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="mail-secondary-button" type="button" onClick={() => setPendingAction(null)}>
                {t("mail.settings.cancel")}
              </button>
              <button
                className="mail-primary-button"
                type="button"
                onClick={() =>
                  pendingAction.kind === "template" ? applyTemplate(pendingAction.template) : applyImport(pendingAction.html)
                }
              >
                {pendingAction.kind === "template"
                  ? t("mail.compose.template_replace_confirm")
                  : t("mail.compose.import_replace_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
