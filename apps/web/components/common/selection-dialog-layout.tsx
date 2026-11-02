/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ComboboxSearch, ComboboxSearchInput } from "@makeplane/propel/elements/combobox";
import { InfoOutline, SearchOutline } from "@makeplane/propel/icons";
import { cn } from "@plane/utils";

/**
 * Building blocks for a dialog whose body is an inline `Combobox` picker: a search row, an optional
 * row of picked items, the scrolling result list and a status + actions footer. Each section draws
 * its own bottom rule so the separators run edge to edge across the dialog.
 */

type TSelectionDialogSearchProps = {
  placeholder: string;
  ariaLabel: string;
  tabIndex?: number;
  /** Extra controls rendered at the end of the search row, e.g. a scope toggle. */
  children?: ReactNode;
};

export function SelectionDialogSearch({ placeholder, ariaLabel, tabIndex, children }: TSelectionDialogSearchProps) {
  return (
    <ComboboxSearch render={<div className="min-h-12 !gap-3 !px-4" />}>
      <SearchOutline aria-hidden className="size-4 flex-shrink-0 text-icon-secondary" />
      <BaseCombobox.Input
        render={<ComboboxSearchInput />}
        placeholder={placeholder}
        aria-label={ariaLabel}
        tabIndex={tabIndex}
        className="!text-body-sm-regular"
      />
      {children}
    </ComboboxSearch>
  );
}

export function SelectionDialogSelected({ children }: { children: ReactNode }) {
  return (
    <div className="flex-shrink-0 border-b border-subtle p-1">
      <div className="vertical-scrollbar scrollbar-md max-h-32 overflow-y-auto px-3 py-1">{children}</div>
    </div>
  );
}

export function SelectionDialogList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "vertical-scrollbar scrollbar-md h-80 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-b border-subtle p-1 [&_[role=option]]:h-10 [&_[role=option]]:px-3 [&_[role=option]]:text-body-sm-medium",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectionDialogFooter({ status, children }: { status?: string; children: ReactNode }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-3 p-1">
      <div className="flex min-h-10 min-w-0 flex-1 items-center gap-1 px-3 py-2 text-caption-md-regular text-tertiary">
        {status && (
          <>
            <InfoOutline aria-hidden className="size-3.5 flex-shrink-0 text-icon-tertiary" />
            <span className="truncate">{status}</span>
          </>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3 px-3 py-2">{children}</div>
    </div>
  );
}
