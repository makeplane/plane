/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Archive, Download, Forward, Reply, ShieldAlert, Star, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TMailMessageDetail } from "@plane/types";
import { formatMailAddress, formatMailDate } from "./helpers";
import { MailHtmlFrame } from "./mail-html-frame";

type Props = {
  folderKey: string;
  message: TMailMessageDetail | null;
  loading?: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onSpam: () => void;
  onToggleStar: () => void;
  onReply: () => void;
  onForward: () => void;
};

export const MessageView = observer(function MessageView(props: Props) {
  const { folderKey, message, loading, onArchive, onDelete, onSpam, onToggleStar, onReply, onForward } = props;
  const { t } = useTranslation();

  if (loading) {
    return (
      <section className="flex min-w-0 flex-1 flex-col bg-[var(--mail-bg)] p-8">
        <div className="h-8 w-2/3 animate-pulse rounded bg-[var(--mail-hover)]" />
        <div className="mt-5 h-16 animate-pulse rounded bg-[var(--mail-hover)]" />
        <div className="mt-8 h-80 animate-pulse rounded bg-[var(--mail-hover)]" />
      </section>
    );
  }

  if (!message) {
    return (
      <section className="text-sm flex min-w-0 flex-1 items-center justify-center bg-[var(--mail-bg)] px-8 text-center text-[var(--mail-muted)]">
        {t("mail.message.empty")}
      </section>
    );
  }

  const isJunkOrTrash = folderKey === "spam" || folderKey === "trash";

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[var(--mail-bg)]">
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[var(--mail-border)] bg-[var(--mail-panel)] px-5">
        <div className="flex items-center gap-1">
          <button
            className="mail-icon-button"
            type="button"
            onClick={onArchive}
            disabled={folderKey === "archive"}
            title={t("mail.actions.archive")}
          >
            <Archive className="size-4" />
          </button>
          <button
            className="mail-icon-button"
            type="button"
            onClick={onSpam}
            disabled={folderKey === "spam"}
            title={t("mail.actions.spam")}
          >
            <ShieldAlert className="size-4" />
          </button>
          <button className="mail-icon-button" type="button" onClick={onDelete} title={t("mail.actions.delete")}>
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="mail-icon-button" type="button" onClick={onToggleStar} title={t("mail.list.star")}>
            <Star
              className={message.is_starred ? "size-4 fill-[var(--mail-accent)] text-[var(--mail-accent)]" : "size-4"}
            />
          </button>
          <button className="mail-icon-button" type="button" onClick={onReply} title={t("mail.actions.reply")}>
            <Reply className="size-4" />
          </button>
          <button className="mail-icon-button" type="button" onClick={onForward} title={t("mail.actions.forward")}>
            <Forward className="size-4" />
          </button>
        </div>
      </div>

      <article className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        {isJunkOrTrash && (
          <div className="text-sm mb-5 rounded-md border border-[var(--mail-border)] bg-[var(--mail-warning)] px-4 py-3 text-[var(--mail-ink)]">
            {folderKey === "spam" ? t("mail.message.spam_banner") : t("mail.message.trash_banner")}
          </div>
        )}

        <h1 className="text-2xl leading-tight font-semibold text-[var(--mail-ink)]">{message.subject}</h1>
        <div className="mt-4 flex items-start justify-between gap-4 border-b border-[var(--mail-border)] pb-5">
          <div className="min-w-0">
            <div className="font-medium text-[var(--mail-ink)]">{formatMailAddress(message.from)}</div>
            <div className="text-xs mt-1 text-[var(--mail-muted)]">
              {t("mail.message.to")} {formatMailAddress(message.to)}
            </div>
          </div>
          <div className="text-xs flex-shrink-0 text-[var(--mail-muted)]">{formatMailDate(message.date)}</div>
        </div>

        {message.html ? (
          <MailHtmlFrame html={message.html} />
        ) : (
          <pre className="mail-message-body text-sm mt-6 max-w-4xl leading-7 break-words whitespace-pre-wrap text-[var(--mail-ink)]">
            {message.text}
          </pre>
        )}

        {!!message.attachments?.length && (
          <div className="mt-8 border-t border-[var(--mail-border)] pt-5">
            <div className="text-sm mb-3 font-medium text-[var(--mail-ink)]">{t("mail.message.attachments")}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.part_id}
                  href={`${API_BASE_URL}/api/mail/folders/${encodeURIComponent(folderKey)}/messages/${encodeURIComponent(message.uid)}/attachments/${encodeURIComponent(attachment.part_id)}/`}
                  className="text-sm flex items-center gap-3 rounded-md border border-[var(--mail-border)] bg-[var(--mail-panel)] px-3 py-2 text-[var(--mail-ink)] hover:border-[var(--mail-accent)]"
                >
                  <Download className="size-4 text-[var(--mail-muted)]" />
                  <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
                  <span className="text-xs text-[var(--mail-muted)]">{Math.ceil(attachment.size / 1024)} KB</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  );
});
