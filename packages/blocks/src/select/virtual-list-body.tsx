/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactElement, Ref, ReactNode } from "react";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Check } from "lucide-react";
import { ComboboxItem, ComboboxItemIndicator, ComboboxList } from "@makeplane/propel/components/combobox";
import {
  ComboboxCheckboxItemIndicator,
  ComboboxItem as ComboboxItemRow,
  ComboboxItemContent,
  ComboboxItemControl,
  ComboboxItemTitle,
  ComboboxItemTrailing,
} from "@makeplane/propel/elements/combobox";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * The slice of the virtualizer the root drives from `onItemHighlighted`. `scrollToIndex` takes an
 * OPTION index (what base-ui reports), which a grouped list translates to a row index before
 * scrolling — heading rows sit between the options and shift everything below them.
 */
export type SelectVirtualizer = {
  options: { count: number };
  scrollToIndex: (index: number, options?: { align?: "auto" | "start" | "center" | "end" }) => void;
};

/**
 * One rendered row: an option, or the non-interactive heading that opens a section. The heading is
 * Plane-owned chrome rather than propel's `ComboboxGroupLabel`, which needs a `Combobox.Group`
 * ancestor — impossible here, since virtualized rows are absolutely-positioned siblings. It is
 * therefore `role="presentation"`: it labels the section visually, but assistive tech announces
 * each option on its own, as the legacy grouped `CustomSearchSelect` sections also did.
 */
type SelectListRow<T> =
  | { kind: "group"; key: string; label: string }
  | { kind: "option"; key: string; item: T; optionIndex: number };

const GROUP_HEADING_CLASSNAME = "px-2 py-1.5 text-caption-md-medium text-tertiary";

/** Wraps rather than truncating: descriptions run longer than the labels they sit under. */
const DESCRIPTION_CLASSNAME = "text-caption-md-regular whitespace-normal text-tertiary";

/**
 * Propel's row is a fixed single-line `h-7`, which clips a description. A height utility would not
 * reliably win — two height classes resolve by stylesheet order, not source order — so the override
 * is an inline style.
 */
const TWO_LINE_ROW_STYLE = { height: "auto", paddingBlock: "0.375rem", alignItems: "flex-start" } as const;

type SelectOptionRowProps = {
  value: string;
  index: number;
  setSize: number;
  disabled?: boolean;
  multiple: boolean;
  label: string;
  icon?: ReactNode;
  trailing?: ReactElement;
  description?: ReactNode;
  href?: string;
};

/**
 * The standard option row: `[checkbox] icon label [check] [trailing]`, with the mark read from
 * base-ui's selection rather than decided per picker.
 *
 * Propel's ready-made `ComboboxItem` draws it, except for a row with a description or an `href` —
 * it takes a `label` string only and sets its own `render`, so those are assembled from the same
 * `elements` parts, in the same order, for the same mark.
 */
function SelectOptionRow(props: SelectOptionRowProps) {
  const { value, index, setSize, disabled, multiple, label, icon, trailing, description, href } = props;
  const itemProps = { value, index, disabled, "aria-setsize": setSize, "aria-posinset": index + 1 };
  const rowStyle = description === undefined ? undefined : TWO_LINE_ROW_STYLE;

  if (description === undefined && href === undefined) {
    return (
      <ComboboxItem
        {...itemProps}
        variant="neutral"
        selection={multiple ? "checkbox" : "check"}
        icon={icon}
        label={label}
        trailing={trailing}
      />
    );
  }

  return (
    <BaseCombobox.Item
      {...itemProps}
      // An `href` swaps only the tag under the styled row, so a navigable row is one
      // `<a role="option">` rather than a link nested in an option.
      render={
        <ComboboxItemRow
          variant="neutral"
          // Propel takes no `style`, so the two-line height goes on the element it renders.
          render={
            href ? (
              // base-ui supplies the anchor's content through `render`, which this rule cannot see.
              // eslint-disable-next-line jsx-a11y/anchor-has-content
              <a href={href} style={rowStyle} />
            ) : rowStyle ? (
              <div style={rowStyle} />
            ) : undefined
          }
        />
      }
    >
      {multiple ? (
        <ComboboxItemControl>
          <BaseCombobox.ItemIndicator keepMounted render={<ComboboxCheckboxItemIndicator />}>
            <Check aria-hidden />
          </BaseCombobox.ItemIndicator>
        </ComboboxItemControl>
      ) : null}
      {icon}
      <ComboboxItemContent>
        <ComboboxItemTitle>{label}</ComboboxItemTitle>
        {description === undefined ? null : <span className={DESCRIPTION_CLASSNAME}>{description}</span>}
      </ComboboxItemContent>
      {multiple ? null : <ComboboxItemIndicator />}
      {trailing === undefined ? null : <ComboboxItemTrailing>{trailing}</ComboboxItemTrailing>}
    </BaseCombobox.Item>
  );
}

type VirtualListBodyProps<T> = {
  items: T[];
  /** Estimated row height (px). Real heights are measured, so this only seeds the window. */
  estimateItemSize: number;
  /** Whether another page can be fetched — gates the paging sentinel. */
  hasMore: boolean;
  /** Returns the append's promise so the loader row can track it — see `isAppending` below. */
  onLoadMore: () => void | Promise<void>;
  /** Loader row rendered at the end of the list while another page is on its way. */
  loader?: ReactNode;
  /** Accessible name for the listbox; propel would otherwise default it to English "Suggestions". */
  listLabel?: string;
  getOptionValue: (option: T) => string;
  getOptionDisabled?: (option: T) => boolean;
  /** When it returns a URL the row renders as an `<a href>` rather than a plain option element. */
  getOptionHref?: (option: T) => string | undefined;
  /** Opens a labelled section whenever the returned value changes as `items` is walked. */
  getOptionGroup?: (option: T) => string | undefined;
  /** Selects the row's mark: a leading checkbox when true, a trailing check when false. */
  multiple: boolean;
  getOptionLabel: (option: T) => string;
  getOptionIcon?: (option: T) => ReactNode;
  getOptionTrailing?: (option: T) => ReactElement | undefined;
  getOptionDescription?: (option: T) => ReactNode;
  /** Deprecated hand-drawn row; when set it replaces the standard row wholesale. */
  renderOption?: (option: T) => ReactNode;
  /**
   * Handed the virtualizer so the root can scroll a keyboard-highlighted row into the rendered
   * window — see `onItemHighlighted` in `root.tsx`.
   */
  virtualizerRef?: Ref<SelectVirtualizer | null>;
};

/**
 * The virtualized option list. Propel's combobox has neither a virtualizer nor infinite paging, so
 * both live here: `useVirtualizer` over `items` inside our own bounded scroller (the root sets
 * `virtualized`, which makes base-ui take each row's `index` from us instead of the DOM), and an
 * `IntersectionObserver` on a sentinel below the last row for `onLoadMore`.
 *
 * Each option is a {@link SelectOptionRow}. A caller still on the deprecated `renderOption` gets its
 * hand-drawn content in the bare styled row instead, and no mark: that row draws its own.
 */
export function VirtualListBody<T>(props: VirtualListBodyProps<T>) {
  const {
    items,
    estimateItemSize,
    hasMore,
    onLoadMore,
    loader,
    listLabel,
    getOptionValue,
    getOptionDisabled,
    getOptionHref,
    getOptionGroup,
    multiple,
    getOptionLabel,
    getOptionIcon,
    getOptionTrailing,
    getOptionDescription,
    renderOption,
    virtualizerRef,
  } = props;
  // Flatten options and (when grouped) their section headings into the one list the virtualizer
  // measures, keeping each option's own index — base-ui addresses rows by that, not by row position.
  const { rows, rowIndexByOption } = useMemo(() => {
    const flattened: SelectListRow<T>[] = [];
    const byOption: number[] = [];
    let openGroup: string | undefined;
    items.forEach((item, optionIndex) => {
      const group = getOptionGroup?.(item);
      if (group !== openGroup) {
        // `undefined` CLOSES the open section — that option sits outside any of them, as the prop
        // documents — rather than inheriting the previous heading.
        openGroup = group;
        // Keyed on the row position as well as the name: a caller whose list revisits a section
        // name further down would otherwise emit the same React key twice.
        if (group) flattened.push({ kind: "group", key: `group:${flattened.length}:${group}`, label: group });
      }
      byOption[optionIndex] = flattened.length;
      flattened.push({ kind: "option", key: getOptionValue(item), item, optionIndex });
    });
    return { rows: flattened, rowIndexByOption: byOption };
  }, [items, getOptionGroup, getOptionValue]);
  // ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Single-flight guard for the observer, which can fire again before React commits `isAppending`.
  const isAppendingRef = useRef(false);
  // states
  // `useInfiniteOptions` only raises its own `isLoading` for a reset (a fresh search), never for an
  // append — so the append is tracked here, off the promise `onLoadMore` hands back.
  const [isAppending, setIsAppending] = useState(false);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateItemSize,
    overscan: 8,
    // The popup mounts and measures in the same frame the panel animates in; seeding a rect keeps
    // the first paint from rendering a single row.
    initialRect: { width: 256, height: 240 },
    // A row that measures 0 has not been laid out yet (the panel is still animating in, or the
    // row's content loaded late). Keeping the estimate for those beats collapsing the list to zero
    // height, which strands the scroller with nothing to scroll and no way back.
    measureElement: (element) => element.getBoundingClientRect().height || estimateItemSize,
  });

  // In virtualized mode base-ui skips its `CompositeList`, so only the rows we actually render
  // register themselves. Keyboard navigation can therefore highlight an index outside the window,
  // where Enter would find no element to click — the root scrolls it back into view through this.
  // The index it hands us is an OPTION index, so it goes through the heading-aware mapping.
  useImperativeHandle(
    virtualizerRef,
    () => ({
      options: { count: items.length },
      scrollToIndex: (index, scrollOptions) =>
        virtualizer.scrollToIndex(rowIndexByOption[index] ?? index, scrollOptions),
    }),
    [virtualizer, rowIndexByOption, items.length]
  );

  // Asks for the next page unless one is already in flight; a Promise result drives the spinner row.
  const requestNextPage = useCallback(() => {
    if (isAppendingRef.current) return;
    const pending = onLoadMore();
    if (!(pending instanceof Promise)) return;
    isAppendingRef.current = true;
    setIsAppending(true);
    void pending.finally(() => {
      isAppendingRef.current = false;
      setIsAppending(false);
    });
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        requestNextPage();
      },
      { root: scrollRef.current }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // `items.length` re-arms the observer after each append. An IntersectionObserver only reports
    // a CHANGE in intersection, so a page too short to push the sentinel out of view would leave it
    // still intersecting, fire nothing, and strand paging with `hasMore` still true.
  }, [hasMore, requestNextPage, items.length]);

  return (
    // Bounded below the panel's own `max-h-72` cap so this scroller — not the panel's ScrollArea —
    // is the one the virtualizer measures.
    <div ref={scrollRef} role="presentation" className="vertical-scrollbar scrollbar-sm max-h-60 overflow-y-auto">
      <ComboboxList aria-label={listLabel}>
        <div role="presentation" className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (row === undefined) return null;
            const rowProps = {
              role: "presentation" as const,
              "data-index": virtualRow.index,
              ref: virtualizer.measureElement,
              className: "absolute top-0 left-0 w-full",
              style: { transform: `translateY(${virtualRow.start}px)` },
            };
            if (row.kind === "group") {
              return (
                <div key={row.key} {...rowProps}>
                  <div className={GROUP_HEADING_CLASSNAME}>{row.label}</div>
                </div>
              );
            }
            const item = row.item;
            const href = getOptionHref?.(item);
            if (renderOption) {
              return (
                <div key={row.key} {...rowProps}>
                  <BaseCombobox.Item
                    value={getOptionValue(item)}
                    index={row.optionIndex}
                    disabled={getOptionDisabled?.(item)}
                    aria-setsize={items.length}
                    aria-posinset={row.optionIndex + 1}
                    // eslint-disable-next-line jsx-a11y/anchor-has-content
                    render={<ComboboxItemRow variant="neutral" render={href ? <a href={href} /> : undefined} />}
                  >
                    {renderOption(item)}
                  </BaseCombobox.Item>
                </div>
              );
            }
            return (
              <div key={row.key} {...rowProps}>
                <SelectOptionRow
                  value={getOptionValue(item)}
                  index={row.optionIndex}
                  setSize={items.length}
                  disabled={getOptionDisabled?.(item)}
                  multiple={multiple}
                  label={getOptionLabel(item)}
                  icon={getOptionIcon?.(item)}
                  trailing={getOptionTrailing?.(item)}
                  description={getOptionDescription?.(item)}
                  href={href}
                />
              </div>
            );
          })}
        </div>
      </ComboboxList>
      {hasMore ? (
        <div ref={sentinelRef} className="w-full">
          {/* The sentinel doubles as the "loading more" slot: an empty 1px strip at rest, the
              loader row while the next page is on its way. */}
          {isAppending ? loader : <span className="block h-px" aria-hidden="true" />}
        </div>
      ) : null}
    </div>
  );
}

VirtualListBody.displayName = "blocks.VirtualListBody";
