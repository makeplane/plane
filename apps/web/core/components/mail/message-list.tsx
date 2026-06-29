/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Link } from "react-router";
import { observer } from "mobx-react";
import { Paperclip, Search, Star } from "lucide-react";
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
  onLoadMore?: () => void;
  onSearch?: (query: string) => void;
  onToggleStar: (message: TMailMessageSummary) => void;
};

const SKELETON_ROWS = ["one", "two", "three", "four", "five", "six", "seven"];

export const MessageList = observer(function MessageList(props: Props) {
  const {
    folderKey,
    messages,
    selectedUid,
    loading,
    hasMore,
    loadingMore,
    showSnippets = true,
    onLoadMore,
    onSearch,
    onToggleStar,
  } = props;
  const { t } = useTranslation();

  return (
    <section className="flex h-full w-[380px] flex-shrink-0 flex-col border-r border-[var(--mail-border)] bg-[var(--mail-panel)]">
      <div className="border-b border-[var(--mail-border)] p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--mail-muted)]" />
          <input
            className="text-sm h-10 w-full rounded-md border border-[var(--mail-border)] bg-white pr-3 pl-9 text-[var(--mail-ink)] outline-none focus:border-[var(--mail-accent)]"
            placeholder={t("mail.search.placeholder")}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch?.(event.currentTarget.value);
            }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {SKELETON_ROWS.map((row) => (
              <div key={row} className="h-20 animate-pulse rounded-md bg-[var(--mail-hover)]" />
            ))}
          </div>
        ) : messages.length ? (
          messages.map((message) => (
            <Link
              key={message.uid}
              to={`/mail/${folderKey}/${message.uid}`}
              className={cn(
                "block border-b border-[var(--mail-border)] px-4 py-3 hover:bg-[var(--mail-hover)]",
                selectedUid === message.uid && "bg-white",
                !message.is_read && "bg-[var(--mail-unread)]"
              )}
            >
              <div className="mb-1 flex items-center gap-2">
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
                <div className="text-sm min-w-0 flex-1 truncate font-medium text-[var(--mail-ink)]">
                  {formatMailAddress(message.from) || t("mail.list.unknown_sender")}
                </div>
                <div className="text-xs flex-shrink-0 text-[var(--mail-muted)]">{formatMailDate(message.date)}</div>
              </div>
              <div className="mb-1 flex items-center gap-2">
                <div
                  className={cn(
                    "text-sm truncate",
                    !message.is_read ? "font-semibold text-[var(--mail-ink)]" : "text-[var(--mail-ink)]"
                  )}
                >
                  {message.subject}
                </div>
                {message.has_attachments && <Paperclip className="size-3.5 flex-shrink-0 text-[var(--mail-muted)]" />}
              </div>
              {showSnippets && (
                <div className="text-xs line-clamp-2 leading-5 text-[var(--mail-muted)]">{message.snippet}</div>
              )}
            </Link>
          ))
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
              className="text-sm w-full rounded-md border border-[var(--mail-border)] bg-white py-2 font-medium text-[var(--mail-muted)] hover:border-[var(--mail-accent)] hover:text-[var(--mail-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? t("mail.list.loading_more") : t("mail.list.load_more")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
});
