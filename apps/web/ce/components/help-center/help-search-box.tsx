/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Forwarded to the input — lets the parent add result keyboard navigation. */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** When set, the input is exposed as a combobox controlling the results listbox. */
  controlsId?: string;
  activeDescendant?: string;
  hasResults?: boolean;
};

// The only help-search surface — all help lookup happens here (there is no
// global command-palette help search). Backend search is multilingual
// (VI/EN/KO) + Vietnamese accent-insensitive; the parent debounces and renders
// the results list.
export const HelpSearchBox = ({ value, onChange, onKeyDown, controlsId, activeDescendant, hasResults }: Props) => {
  const { t } = useTranslation();
  return (
    <div
      role="search"
      className="flex items-center gap-2 rounded-lg border border-subtle bg-layer-2 px-3 py-2.5 focus-within:border-strong focus-within:ring-1 focus-within:ring-accent-strong"
    >
      <Search className="size-4 shrink-0 text-icon-primary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t("help_center.search_placeholder")}
        aria-label={t("help_center.search_placeholder")}
        role={controlsId ? "combobox" : undefined}
        aria-expanded={controlsId ? !!hasResults : undefined}
        aria-controls={controlsId}
        aria-activedescendant={activeDescendant}
        aria-autocomplete={controlsId ? "list" : undefined}
        className="w-full bg-transparent text-14 text-primary outline-none placeholder:text-placeholder"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("help_center.cancel")}
          className="shrink-0 rounded p-1 text-tertiary hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-strong"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
};
