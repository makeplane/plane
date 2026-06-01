/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "@plane/i18n";

// Vietnamese words are rarely a single character; mirror the home min-length.
const MIN_QUERY_LENGTH = 2;

// Compact header search so lookup is reachable while reading an article (the home
// search box is otherwise the only surface). Submitting deep-links to the home
// results via `?q=`, which is the search source of truth there. Hidden on small
// screens to keep the 52px bar uncluttered (the brand link → home search remains).
export const HelpHeaderSearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (term.length >= MIN_QUERY_LENGTH) void navigate(`/help?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setQuery("");
      event.currentTarget.blur();
    }
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className="hidden items-center gap-2 rounded-md border border-subtle bg-layer-2 px-2.5 py-1.5 focus-within:border-strong focus-within:ring-1 focus-within:ring-accent-strong md:flex"
    >
      <Search className="size-4 shrink-0 text-icon-primary" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t("help_center.search_placeholder")}
        aria-label={t("help_center.search_placeholder")}
        className="w-40 bg-transparent text-13 text-primary outline-none placeholder:text-placeholder lg:w-56"
      />
    </form>
  );
};
