/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import { observer } from "mobx-react";
import { AlertCircle, CheckCircle2, LoaderCircle, Paperclip, Search, Star } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TMailMessageSummary } from "@plane/types";
import { formatMailAddress, formatMailDate } from "./helpers";

type Props = {
  folderKey: string;
  messages: TMailMessageSummary[];
  selectedUid?: string;
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  showSnippets?: boolean;
  compact?: boolean;
  layout?: "side" | "stacked" | "full";
  onLoadMore?: () => void;
  onSearch?: (query: string) => void;
  onToggleStar: (message: TMailMessageSummary) => void;
};

const SKELETON_ROWS = ["one", "two", "three", "four", "five", "six", "seven"];

const SEND_STATUS_STYLES = {
  queued: "bg-[var(--mail-warning)] text-[var(--mail-muted)]",
  sending: "bg-[var(--mail-accent-soft)] text-[var(--mail-accent)]",
  sent: "bg-[var(--mail-hover)] text-[var(--mail-muted)]",
  failed: "bg-[var(--mail-accent-soft)] text-[var(--mail-accent)]",
};

export const MessageList = observer(function MessageList(props: Props) {
  const {
    folderKey,
    messages,
    selectedUid,
    loading,
    hasMore,
    loadingMore,
    showSnippets = true,
    compact = false,
    layout = "side",
    onLoadMore,
    onSearch,
    onToggleStar,
  } = props;
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "flex flex-shrink-0 flex-col border-[var(--mail-border)] bg-[var(--mail-panel)]",
        layout === "side" && "h-full w-[380px] border-r",
        layout === "stacked" && "h-[42%] min-h-[220px] w-full border-b",
        layout === "full" && "size-full"
      )}
    >
      <div className={cn("border-b border-[var(--mail-border)]", compact ? "p-3" : "p-4")}>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--mail-muted)]" />
          <input
            className={cn(
              "text-sm w-full rounded-md border border-[var(--mail-border)] bg-white pr-3 pl-9 text-[var(--mail-ink)] outline-none focus:border-[var(--mail-accent)]",
              compact ? "h-9" : "h-10"
            )}
            placeholder={t("mail.search.placeholder")}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch?.(event.currentTarget.value);
            }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className={cn("space-y-3", compact ? "p-3" : "p-4")}>
            {SKELETON_ROWS.map((row) => (
              <div
                key={row}
                className={cn("animate-pulse rounded-md bg-[var(--mail-hover)]", compact ? "h-14" : "h-20")}
              />
            ))}
          </div>
        ) : messages.length ? (
          messages.map((message) => {
            const isOutboundPlaceholder = message.uid.startsWith("outbound:");
            const rowClassName = cn(
              "block border-b border-[var(--mail-border)] px-4 hover:bg-[var(--mail-hover)]",
              compact ? "py-2" : "py-3",
              selectedUid === message.uid && "bg-[var(--mail-panel)] ring-1 ring-[var(--mail-accent)] ring-inset",
              !message.is_read && "bg-[var(--mail-unread)]",
              isOutboundPlaceholder && "cursor-default"
            );
            const sendStatus = message.send_status;
            const content = (
              <>
                <div className={cn("flex items-center gap-2", compact ? "mb-0.5" : "mb-1")}>
                  {!isOutboundPlaceholder && (
                    <button
                      type="button"
                      className="grid size-6 flex-shrink-0 place-items-center rounded text-[var(--mail-muted)] hover:bg-[var(--mail-accent-soft)] hover:text-[var(--mail-accent)]"
                      onClick={(event) => {
                        event.preventDefault();
                        onToggleStar(message);
                      }}
                      title={message.is_starred ? t("mail.list.unstar") : t("mail.list.star")}
                    >
                      <Star
                        className={cn(
                          "size-4",
                          message.is_starred && "fill-[var(--mail-accent)] text-[var(--mail-accent)]"
                        )}
                      />
                    </button>
                  )}
                  <div className="text-sm min-w-0 flex-1 truncate font-medium text-[var(--mail-ink)]">
                    {formatMailAddress(message.from) || t("mail.list.unknown_sender")}
                  </div>
                  {sendStatus && (
                    <span
                      className={cn(
                        "inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        SEND_STATUS_STYLES[sendStatus] ?? SEND_STATUS_STYLES.sent
                      )}
                      title={message.send_error || undefined}
                    >
                      {sendStatus === "sending" && <LoaderCircle className="size-3 animate-spin" />}
                      {sendStatus === "failed" && <AlertCircle className="size-3" />}
                      {sendStatus === "sent" && <CheckCircle2 className="size-3" />}
                      {t(`mail.list.send_status.${sendStatus}`)}
                    </span>
                  )}
                  <div className="text-xs flex-shrink-0 text-[var(--mail-muted)]">{formatMailDate(message.date)}</div>
                </div>
                <div className={cn("flex items-center gap-2", compact ? "mb-0.5" : "mb-1")}>
                  <div
                    className={cn(
                      "text-sm truncate",
                      !message.is_read ? "font-semibold text-[var(--mail-ink)]" : "text-[var(--mail-ink)]"
                    )}
                  >
                    {message.subject || t("mail.list.no_subject")}
                  </div>
                  {message.has_attachments && <Paperclip className="size-3.5 flex-shrink-0 text-[var(--mail-muted)]" />}
                </div>
                {showSnippets && (
                  <div
                    className={cn(
                      "text-xs text-[var(--mail-muted)]",
                      compact ? "line-clamp-1 leading-4" : "line-clamp-2 leading-5"
                    )}
                  >
                    {message.snippet}
                  </div>
                )}
              </>
            );

            return isOutboundPlaceholder ? (
              <div key={message.uid} className={rowClassName}>
                {content}
              </div>
            ) : (
              <Link key={message.uid} to={`/mail/${folderKey}/${message.uid}`} className={rowClassName}>
                {content}
              </Link>
            );
          })
        ) : (
          <div className="text-sm flex h-full items-center justify-center px-8 text-center text-[var(--mail-muted)]">
            {t("mail.list.empty")}
          </div>
        )}

        {!loading && hasMore && (
          <div className="p-3">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="text-sm w-full rounded-md border border-[var(--mail-border)] bg-[var(--mail-panel)] py-2 font-medium text-[var(--mail-muted)] hover:border-[var(--mail-accent)] hover:text-[var(--mail-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? t("mail.list.loading_more") : t("mail.list.load_more")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
});
