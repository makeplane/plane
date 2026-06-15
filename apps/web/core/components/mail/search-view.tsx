/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useMail } from "@/hooks/store/use-mail";
import { formatMailAddress, formatMailDate } from "./helpers";

export const MailSearchView = observer(function MailSearchView() {
  const { t } = useTranslation();
  const mail = useMail();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const unread = searchParams.get("unread") === "true";
  const starred = searchParams.get("starred") === "true";
  const labelId = searchParams.get("label") ?? "";
  const activeLabel = labelId ? mail.labels.find((label) => label.id === labelId) : undefined;

  useEffect(() => {
    if (!mail.labels.length) mail.fetchSettings().catch(() => undefined);
  }, [mail]);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const label = searchParams.get("label") ?? "";
    const params: Record<string, unknown> = {};
    if (q) params.q = q;
    if (label) params.label = label;
    if (searchParams.get("unread") === "true") params.unread = "true";
    if (searchParams.get("starred") === "true") params.starred = "true";
    if (q || label || params.unread || params.starred) mail.search(params).catch(() => undefined);
  }, [mail, searchParams]);

  const setParam = (key: string, value: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, "true");
    else next.delete(key);
    setSearchParams(next);
  };

  const filterButton = (active: boolean, label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md px-3 py-2 text-left",
        active ? "bg-[var(--mail-accent-soft)] font-medium text-[var(--mail-accent)]" : "hover:bg-[var(--mail-hover)]"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex size-full overflow-hidden">
      <aside className="hidden w-[260px] flex-shrink-0 border-r border-[var(--mail-border)] bg-[var(--mail-panel)] p-5 lg:block">
        <div className="mb-3 text-sm font-semibold">{t("mail.search.filters")}</div>
        <div className="space-y-2 text-sm text-[var(--mail-muted)]">
          {filterButton(!unread && !starred, t("mail.search.any_folder"), () => {
            const next = new URLSearchParams(searchParams);
            next.delete("unread");
            next.delete("starred");
            setSearchParams(next);
          })}
          {filterButton(unread, t("mail.search.unread"), () => setParam("unread", !unread))}
          {filterButton(starred, t("mail.search.starred"), () => setParam("starred", !starred))}
        </div>
      </aside>
      <section className="min-w-0 flex-1 overflow-y-auto bg-[var(--mail-bg)] p-6">
        <form
          className="relative max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            const next = new URLSearchParams(searchParams);
            if (query) next.set("q", query);
            else next.delete("q");
            setSearchParams(next);
          }}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--mail-muted)]" />
          <input
            className="h-11 w-full rounded-md border border-[var(--mail-border)] bg-white pl-10 pr-3 text-sm outline-none focus:border-[var(--mail-accent)]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("mail.search.placeholder")}
          />
        </form>

        {activeLabel && (
          <div className="mt-3 flex max-w-3xl items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-[var(--mail-accent-soft)] px-3 py-1 text-sm text-[var(--mail-accent)]">
              <span className="size-2.5 rounded" style={{ backgroundColor: activeLabel.color }} />
              {activeLabel.name}
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("label");
                  setSearchParams(next);
                }}
              >
                <X className="size-3.5" />
              </button>
            </span>
          </div>
        )}

        <div className="mt-6 max-w-4xl overflow-hidden rounded-md border border-[var(--mail-border)] bg-white">
          {mail.searchResults.length ? (
            mail.searchResults.map((message) => (
              <Link
                key={`${message.folder_key}-${message.uid}`}
                to={`/mail/${message.folder_key}/${message.uid}`}
                className="block border-b border-[var(--mail-border)] px-4 py-3 last:border-b-0 hover:bg-[var(--mail-hover)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 truncate text-sm font-medium text-[var(--mail-ink)]">{message.subject}</div>
                  <div className="flex-shrink-0 text-xs text-[var(--mail-muted)]">{formatMailDate(message.date)}</div>
                </div>
                <div className="mt-1 text-xs text-[var(--mail-muted)]">{formatMailAddress(message.from)}</div>
                <div className="mt-2 line-clamp-2 text-sm text-[var(--mail-muted)]">{message.snippet}</div>
              </Link>
            ))
          ) : (
            <div className="px-5 py-10 text-center text-sm text-[var(--mail-muted)]">{t("mail.search.empty")}</div>
          )}
        </div>
      </section>
    </div>
  );
});
