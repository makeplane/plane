/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { useMail } from "@/hooks/store/use-mail";
import { formatMailAddress, formatMailDate } from "./helpers";

export const MailSearchView = observer(function MailSearchView() {
  const { t } = useTranslation();
  const mail = useMail();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q) mail.search({ q }).catch(() => undefined);
  }, [mail, searchParams]);

  return (
    <div className="flex size-full overflow-hidden">
      <aside className="hidden w-[260px] flex-shrink-0 border-r border-[var(--mail-border)] bg-[var(--mail-panel)] p-5 lg:block">
        <div className="mb-3 text-sm font-semibold">{t("mail.search.filters")}</div>
        <div className="space-y-2 text-sm text-[var(--mail-muted)]">
          <button className="w-full rounded-md bg-[var(--mail-hover)] px-3 py-2 text-left">{t("mail.search.any_folder")}</button>
          <button className="w-full rounded-md px-3 py-2 text-left hover:bg-[var(--mail-hover)]">{t("mail.search.unread")}</button>
          <button className="w-full rounded-md px-3 py-2 text-left hover:bg-[var(--mail-hover)]">{t("mail.search.with_attachments")}</button>
        </div>
      </aside>
      <section className="min-w-0 flex-1 overflow-y-auto bg-[var(--mail-bg)] p-6">
        <form
          className="relative max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            setSearchParams({ q: query });
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
