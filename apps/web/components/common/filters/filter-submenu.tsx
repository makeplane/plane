/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useState } from "react";
// plane imports
import {
  MenuCheckboxItem,
  MenuSearch,
  MenuSubmenu,
  MenuSubmenuContent,
  MenuSubmenuTrigger,
} from "@makeplane/propel/components/menu";
import { useTranslation } from "@plane/i18n";

export type TFilterSubmenuOption<V extends string | number = string> = {
  value: V;
  label: string;
  icon?: ReactNode;
  /** Content pinned at the row's end, e.g. a marker for the current cycle. */
  trailing?: ReactNode;
  /** Text the search matches besides `label`, e.g. a member's name on a row labelled "You". */
  searchText?: string;
};

type Props<V extends string | number> = {
  /** The filter property, shown on the row that opens the submenu. */
  label: string;
  options: TFilterSubmenuOption<V>[];
  appliedFilters: V[] | null | undefined;
  onToggle: (value: V) => void;
  /** Pins a search field above the options; meant for lists that can grow long (members, labels…). */
  searchable?: boolean;
  /** Extra rows rendered after the options, e.g. a date filter's "Custom" row. */
  children?: ReactNode;
  onOpenChange?: (open: boolean) => void;
};

/** Number of applied values, shown at the end of a filter property's row. */
export function FilterSubmenuCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="text-caption-md-regular text-tertiary tabular-nums">{count}</span>;
}

/**
 * One property of a filters menu: a row carrying the applied count that opens a submenu of
 * checkable values.
 */
export function FilterSubmenu<V extends string | number = string>(props: Props<V>) {
  const { label, options, appliedFilters, onToggle, searchable = false, children, onOpenChange } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [searchQuery, setSearchQuery] = useState("");
  // derived values
  const appliedValues = new Set<V>(appliedFilters ?? []);
  const query = searchQuery.trim().toLowerCase();
  const visibleOptions = query
    ? options.filter((option) => `${option.label} ${option.searchText ?? ""}`.toLowerCase().includes(query))
    : options;

  return (
    <MenuSubmenu onOpenChange={(open) => onOpenChange?.(open)}>
      <MenuSubmenuTrigger label={label} trailing={<FilterSubmenuCount count={appliedFilters?.length ?? 0} />} />
      <MenuSubmenuContent
        search={
          searchable ? (
            <MenuSearch
              aria-label={t("common.search.label")}
              placeholder={t("common.search.label")}
              value={searchQuery}
              onValueChange={setSearchQuery}
              autoComplete="off"
            />
          ) : undefined
        }
      >
        {visibleOptions.length > 0 ? (
          visibleOptions.map((option) => (
            <MenuCheckboxItem
              key={String(option.value)}
              label={option.label}
              icon={option.icon}
              trailing={option.trailing}
              checked={appliedValues.has(option.value)}
              onCheckedChange={() => onToggle(option.value)}
            />
          ))
        ) : (
          <p className="px-2 py-1.5 text-caption-md-regular text-placeholder">{t("common.search.no_matches_found")}</p>
        )}
        {children}
      </MenuSubmenuContent>
    </MenuSubmenu>
  );
}
