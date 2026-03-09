/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { autoUpdate, flip, FloatingOverlay, FloatingPortal, offset, shift, useFloating } from "@floating-ui/react";
import type { Editor } from "@tiptap/core";
import { CalendarDays } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Calendar } from "@plane/propel/calendar";
import { ScrollArea } from "@plane/propel/scrollarea";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
// extensions
import type { Suggestion, SuggestionKind } from "@/extensions/pql-editor/types";

type PQLAutocompleteDropdownProps = {
  editor: Editor;
  suggestions: Suggestion[];
  activeIndex: number;
  anchor: { top: number; left: number; bottom: number } | null;
  onSelect: (suggestion: Suggestion) => void;
  onClose: () => void;
  /** When true a date-picker panel is shown alongside the suggestion list */
  showDatePicker?: boolean;
};

const KIND_LABELS: Record<SuggestionKind, string> = {
  field: "Fields",
  operator: "Operators",
  value: "Values",
  function: "Functions",
  keyword: "Keywords",
};

/**
 * Floating autocomplete dropdown for the PQL editor.
 * Uses Floating UI for automatic placement (flip/shift), scroll locking, and
 * portal rendering — anchored to the cursor position via a virtual reference
 * element built from the coordinates provided by the autocomplete plugin.
 */
export function PQLAutocompleteDropdown({
  editor,
  suggestions,
  activeIndex,
  anchor,
  onSelect,
  onClose,
  showDatePicker = false,
}: PQLAutocompleteDropdownProps) {
  // translation
  const { t } = useTranslation();
  // refs
  const listRef = useRef<HTMLUListElement>(null);
  // calendar selected date (purely local UI state — the real insertion happens via onSelect)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // Sync the virtual reference element with the cursor anchor whenever it changes
  useLayoutEffect(() => {
    if (!anchor) return;
    refs.setReference({
      getBoundingClientRect() {
        return {
          x: anchor.left,
          y: anchor.top,
          top: anchor.top,
          left: anchor.left,
          bottom: anchor.bottom,
          right: anchor.left,
          width: 0,
          height: anchor.bottom - anchor.top,
        };
      },
    });
  }, [anchor, refs]);

  // Scroll the active item into view.
  // scrollIntoView({ block: "nearest" }) is a no-op when the element is already
  // visible, and the browser automatically scrolls the nearest scrollable
  // ancestor (the ScrollArea viewport) when it isn't.
  useLayoutEffect(() => {
    const item = listRef.current?.querySelector(`[data-suggestion-index="${activeIndex}"]`) as HTMLElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Close when clicking outside the floating panel
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const el = refs.floating.current;
      if (el && !el.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose, refs.floating]);

  if (!anchor || (suggestions.length === 0 && !showDatePicker)) return null;
  if (!editor.isEditable || (!editor.isFocused && !showDatePicker)) return null;

  const groups = groupBySectionOrder(suggestions);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    const formattedDate = renderFormattedPayloadDate(date);
    onSelect({
      kind: "value",
      icon: CalendarDays,
      label: formattedDate || "",
      insertText: `"${formattedDate}"`,
      appendCharacter: "whitespace",
      sortOrder: -1,
    });
  };

  return (
    <FloatingPortal>
      {/* Locks background scroll while the autocomplete is open */}
      <FloatingOverlay style={{ zIndex: 99 }} lockScroll />
      <div
        ref={refs.setFloating}
        id="pql-autocomplete-dropdown"
        role="listbox"
        aria-label="PQL autocomplete suggestions"
        className="rounded-md border-[0.5px] border-strong bg-surface-1 shadow-raised-200"
        style={{ ...floatingStyles, zIndex: 100 }}
      >
        <div className={cn("size-full flex", showDatePicker ? "divide-x divide-subtle w-170" : "w-90")}>
          {/* ── Suggestions list ─────────────────────────────────────────── */}
          {suggestions.length > 0 && (
            <ul ref={listRef} className="shrink-0 max-h-80 w-90 pb-2.5" role="presentation">
              <ScrollArea
                rootClassName="h-full"
                viewportClassName="h-full px-2"
                scrollType="hover"
                orientation="vertical"
                size="sm"
              >
                {groups.map(({ kind, items, startIndex }) => (
                  <li key={kind} role="presentation">
                    <div className="sticky top-0 bg-surface-1 py-2.5 px-1 text-caption-xs-semibold text-placeholder uppercase">
                      {KIND_LABELS[kind]}
                    </div>
                    {items.map((suggestion, i) => {
                      const globalIndex = startIndex + i;
                      const isActive = globalIndex === activeIndex;
                      return (
                        <SuggestionItem
                          key={`${kind}-${i}`}
                          index={globalIndex}
                          suggestion={suggestion}
                          isActive={isActive}
                          onSelect={onSelect}
                        />
                      );
                    })}
                  </li>
                ))}
              </ScrollArea>
            </ul>
          )}

          {/* ── Date picker panel ────────────────────────────────────────── */}
          {showDatePicker && (
            <div
              role="presentation"
              className="shrink-0"
              // Prevent the calendar's mousedown events from closing the dropdown
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-10 font-semibold uppercase tracking-wide text-placeholder border-b border-subtle">
                {t("pql.autocomplete_dropdown.pick_date")}
              </div>
              <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} />
            </div>
          )}
        </div>
        <div className="border-t border-subtle px-3 py-1.5 text-10 text-placeholder flex items-center gap-1.5">
          <kbd className="rounded border border-subtle px-1 py-0.5 font-code text-10 text-tertiary">↑↓</kbd>
          <span>{t("pql.autocomplete_dropdown.navigate")}</span>
          <span className="text-subtle-1">·</span>
          <kbd className="rounded border border-subtle px-1 py-0.5 font-code text-10 text-tertiary">↵</kbd>
          <span>{t("pql.autocomplete_dropdown.accept")}</span>
          <span className="text-subtle-1">·</span>
          <kbd className="rounded border border-subtle px-1 py-0.5 font-code text-10 text-tertiary">Esc</kbd>
          <span>{t("pql.autocomplete_dropdown.close")}</span>
        </div>
      </div>
    </FloatingPortal>
  );
}

// ─── Suggestion item ──────────────────────────────────────────────────────────

type SuggestionItemProps = {
  index: number;
  suggestion: Suggestion;
  isActive: boolean;
  onSelect: (s: Suggestion) => void;
};

function SuggestionItem({ index, suggestion, isActive, onSelect }: SuggestionItemProps) {
  // translation
  const { t } = useTranslation();

  return (
    <li
      role="option"
      aria-selected={isActive}
      data-suggestion-index={index}
      className={cn(
        "flex items-center gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate hover:bg-layer-1-hover cursor-pointer transition-colors",
        {
          "bg-layer-1-hover": isActive,
          "items-center": !suggestion.i18n_description,
        }
      )}
      onMouseDown={(e) => {
        // preventDefault keeps focus on the editor; stopPropagation prevents
        // any stacked ProseMirror/document handlers from re-consuming the event
        // before React finishes calling onSelect.
        e.preventDefault();
        e.stopPropagation();
        onSelect(suggestion);
      }}
    >
      {suggestion.icon ? (
        <span className="shrink-0 size-4 grid place-items-center" aria-hidden>
          <suggestion.icon className="size-3 text-placeholder" />
        </span>
      ) : (
        suggestion.iconNode
      )}
      <div className="grow truncate">
        <span className="flex-1 text-body-sm-regular text-secondary truncate">{suggestion.label}</span>
        {suggestion.i18n_description && (
          <p className="shrink-0 truncate text-caption-md-regular text-placeholder">{t(suggestion.i18n_description)}</p>
        )}
      </div>
    </li>
  );
}

// ─── Grouping helper ──────────────────────────────────────────────────────────

const SECTION_ORDER: SuggestionKind[] = ["field", "operator", "value", "function", "keyword"];

type SuggestionGroup = {
  kind: SuggestionKind;
  items: Suggestion[];
  startIndex: number;
};

function groupBySectionOrder(suggestions: Suggestion[]): SuggestionGroup[] {
  const byKind = new Map<SuggestionKind, Suggestion[]>();
  for (const s of suggestions) {
    const group = byKind.get(s.kind) ?? [];
    group.push(s);
    byKind.set(s.kind, group);
  }

  const groups: SuggestionGroup[] = [];
  let runningIndex = 0;
  for (const kind of SECTION_ORDER) {
    const items = byKind.get(kind);
    if (!items || items.length === 0) continue;
    groups.push({ kind, items, startIndex: runningIndex });
    runningIndex += items.length;
  }
  return groups;
}
