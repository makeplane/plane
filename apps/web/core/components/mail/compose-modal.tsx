/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ChangeEvent } from "react";
import { observer } from "mobx-react";
import { Paperclip, Save, Send, X } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { useMail } from "@/hooks/store/use-mail";
import { splitRecipients } from "./helpers";
import { MailRichText } from "./mail-rich-text";

export const ComposeModal = observer(function ComposeModal() {
  const { t } = useTranslation();
  const mail = useMail();
  const draft = mail.composeDraft;

  if (!mail.composeOpen) return null;

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    try {
      await Promise.all(files.map((file) => mail.uploadAttachment(file)));
      event.target.value = "";
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.upload_error") });
    }
  };

  const sendMessage = async () => {
    try {
      await mail.sendCompose();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.compose.sent") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.send_error") });
    }
  };

  const saveDraft = async () => {
    try {
      await mail.saveDraft();
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("mail.compose.draft_saved") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("mail.compose.draft_error") });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-6">
      <section className="shadow-2xl flex h-[680px] max-h-[calc(100vh-48px)] w-[920px] max-w-[calc(100vw-48px)] overflow-hidden rounded-lg bg-white">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 items-center justify-between border-b border-[var(--mail-border)] bg-[var(--mail-ink)] px-4 text-white">
            <div className="text-sm font-medium">{t("mail.compose.new")}</div>
            <button
              className="grid size-8 place-items-center rounded hover:bg-white/10"
              type="button"
              onClick={mail.closeCompose}
            >
              <X className="size-4" />
            </button>
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
            <label className="mail-icon-button cursor-pointer" title={t("mail.compose.attach")}>
              <Paperclip className="size-4" />
              <input className="hidden" type="file" multiple onChange={uploadFiles} />
            </label>
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
                  onClick={() =>
                    mail.updateComposeDraft({
                      subject: template.subject || draft.subject,
                      body_html: template.body_html,
                      body_text: template.body_text,
                    })
                  }
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
    </div>
  );
});
