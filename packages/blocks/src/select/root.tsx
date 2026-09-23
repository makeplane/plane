/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@plane/i18n";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Button } from "@makeplane/propel/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxSearch,
  ComboboxStatus,
  useFilter,
} from "@makeplane/propel/components/combobox";
import type { TPaginatedResponse } from "@plane/types";
import { SelectContext } from "./context";
import { useSelectDropdownPlacement } from "./dropdown-placement";
import { SelectEngineContext } from "./engine-context";
import type { SelectEngineContextValue } from "./engine-context";
import { MENU_ROW_HEIGHT, SELECT_OPTION_ROW_HEIGHT } from "./select.constants";
import { SelectOptionsSkeleton } from "./skeleton";
import type { SelectContextValue, SelectPaginationParams, SelectProps } from "./types";
import { useInfiniteOptions } from "./use-infinite-options";
import { useSkipDisabledRows } from "./use-skip-disabled-rows";
import { pinSelected } from "./utils";
import type { SelectVirtualizer } from "./virtual-list-body";
import { VirtualListBody } from "./virtual-list-body";

/**
 * Keeps an array's identity for as long as its contents are unchanged. Ruling 43's
 * `getValues={() => options}` idiom and an inline `value={[...]}` both rebuild their array on every
 * render; the selection derived from them feeds `SelectContext`, `applyOpenSideEffects` and
 * base-ui's selection-index effect, so a fresh identity re-renders every trigger for nothing.
 */
function useStableItems<T>(next: T[]): T[] {
  const ref = useRef(next);
  const previous = ref.current;
  if (previous !== next && (previous.length !== next.length || previous.some((item, index) => item !== next[index]))) {
    ref.current = next;
  }
  return ref.current;
}

export function SelectRoot<T>(props: SelectProps<T>) {
  const {
    getOptionValue,
    getOptionLabel,
    getOptionSearchText,
    getOptionIcon,
    getOptionTrailing,
    getOptionDescription,
    renderOption,
    renderChip,
    filterOption,
    getOptionDisabled,
    getOptionHref,
    getOptionGroup,
    getOptionPlaceholder,
    header,
    footer,
    onSearchSubmit,
    value,
    disabled = false,
    placeholder,
    searchPlaceholder,
    showSearch = true,
    emptyMessage = "No results found",
    onClose,
    children,
    // The standard row is a fixed single line; hand-drawn and two-line rows are taller.
    estimateItemSize = renderOption || getOptionDescription ? MENU_ROW_HEIGHT : SELECT_OPTION_ROW_HEIGHT,
    multiple = false,
    headerItems,
    filterHeaderItems = false,
    lazyMount = true,
    modal = false,
    pinSelected: shouldPinSelected = true,
    contentSizing = "auto",
    defaultOpen = false,
    open: controlledOpen,
    onOpenChange,
    positionerZIndex,
    errorMessage,
    searchingMessage,
  } = props;

  const labelOf = useCallback(
    (option: T) => getOptionLabel?.(option) ?? getOptionValue(option),
    [getOptionLabel, getOptionValue]
  );
  // What the sync filter matches on. Separate from `labelOf` so a row can read one way and still be
  // reachable by another string (a project's identifier beside its name).
  const searchTextOf = useCallback(
    (option: T) => getOptionSearchText?.(option) ?? labelOf(option),
    [getOptionSearchText, labelOf]
  );

  const isInfinite = props.infinite === true;

  // Infinite hook is always called (Rules of Hooks); only consumed in infinite mode. The no-op
  // fallback keeps the hook cheap when the consumer is in the sync path.
  const noopGetValues = useCallback<(params: SelectPaginationParams) => Promise<TPaginatedResponse<T[]>>>(
    () => Promise.resolve({ results: [] }),
    []
  );
  const paginatedGetValues = isInfinite ? props.getValues : noopGetValues;
  const infinite = useInfiniteOptions<T>(paginatedGetValues, getOptionValue);
  const { onSearchChange, onLoadMore, onOpen: onInfiniteOpen, onClose: onInfiniteClose } = infinite;

  // Everything currently loaded, whichever source it came from — what `valueIds` resolves against.
  const loadedOptions = isInfinite ? infinite.items : props.getValues();

  // Normalize the single (`T | null`), multi (`T[]`) and ids-in (`valueIds`) forms into one array.
  // Ruling 46: in ids mode an id with no loaded option becomes `getOptionPlaceholder(id)` rather
  // than being dropped, and `selectedIds` below carries it regardless — so the id cannot fall out
  // of the next `onChange` even when the caller supplies no placeholder to draw.
  const valueIds = props.valueIds;
  // Ids-in mode resolves against what is currently loaded — and an infinite list is emptied on
  // every close (`useInfiniteOptions.onClose`), so with nothing but `loadedOptions` to go on the
  // closed trigger would stop naming the very options it had just shown. Every option seen while
  // the list was open is remembered here and consulted before `getOptionPlaceholder`; the cache is
  // pruned back to the live `valueIds` on each resolve, so it stays selection-sized and an id the
  // caller has dropped can never be resolved from a stale object.
  const resolutionCacheRef = useRef(new Map<string, T>());
  const resolvedFromIds = useMemo<T[] | null>(() => {
    if (!valueIds) return null;
    const cache = resolutionCacheRef.current;
    for (const option of loadedOptions) cache.set(getOptionValue(option), option);
    const resolved = valueIds
      .map((id) => {
        const cached = cache.get(id);
        if (cached !== undefined) return cached;
        // The stand-in is cached too: built inline (`(id) => ({ id, name: id })`) it would
        // otherwise be a new object every render. A real option overwrites it above the moment it
        // loads.
        const standIn = getOptionPlaceholder?.(id);
        if (standIn !== undefined) cache.set(id, standIn);
        return standIn;
      })
      .filter((option): option is T => option !== undefined);
    const live = new Set(valueIds);
    for (const id of cache.keys()) if (!live.has(id)) cache.delete(id);
    return resolved;
  }, [valueIds, loadedOptions, getOptionValue, getOptionPlaceholder]);

  const selected = useStableItems<T>(
    resolvedFromIds ?? (multiple ? ((value as T[]) ?? []) : value ? [value as T] : [])
  );

  // Snapshot of the selection taken each time the dropdown opens. Pinning against this snapshot
  // (rather than live `value`) keeps options from jumping to the top mid-interaction — they reorder
  // on the next open instead, matching the rest of the dropdowns.
  const [pinnedSelected, setPinnedSelected] = useState<T[]>([]);

  // Open state is uncontrolled by default; a caller that needs to open the picker itself passes
  // `open` (and `onOpenChange` to hear about the user's own opens and closes).
  const isOpenControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = isOpenControlled ? controlledOpen : uncontrolledOpen;
  // `onInputValueChange` fires on close too (base-ui clears the query as the popup unmounts). That
  // clear must not re-run the search, so the handler reads the live open state off a ref rather
  // than the state it would see stale within the same commit.
  const isOpenRef = useRef(false);

  // Lazy mount: at rest the base-ui Root, the popup and the option list are not mounted at all —
  // `Select.Trigger` renders as a cheap button that mounts and opens them in one action. That keeps
  // the per-cell cost of a never-opened dropdown down to one button in list/board/spreadsheet
  // layouts. Sticky once activated, so the trigger keeps focus across a close.
  const [isEngineMounted, setIsEngineMounted] = useState(!lazyMount || defaultOpen || controlledOpen === true);

  // Sync mode filters in memory against the same locale-aware matcher base-ui's own filter uses.
  const [syncQuery, setSyncQuery] = useState("");
  const { contains } = useFilter();
  const query = isInfinite ? infinite.query : syncQuery;

  // translation
  const { t } = useTranslation();

  // Base UI skips its `CompositeList` in virtualized mode, so a row only registers itself while it
  // is rendered. Keyboard navigation can walk the highlight past the rendered window, where Enter
  // would find no element to click — scrolling the highlighted index back into view keeps the row
  // mounted (and registered) before the next keystroke lands.
  const virtualizerRef = useRef<SelectVirtualizer | null>(null);
  // Which row Enter would select, for `onSearchSubmit`. Base UI highlights nothing until the user
  // arrows (it takes no `autoHighlight`), and reports `-1` when it clears the highlight again.
  const highlightedIndexRef = useRef(-1);
  const handleItemHighlighted = useCallback((_item: unknown, details: { index: number; reason: string }) => {
    highlightedIndexRef.current = details.index;
    // Only keyboard and programmatic highlights need the list moved. `align: "auto"` still scrolls
    // a PARTIALLY visible row, so honouring `reason: "pointer"` would nudge the list under the
    // cursor as the user hovers the bottom row.
    if (details.reason !== "keyboard" && details.reason !== "none") return;
    const virtualizer = virtualizerRef.current;
    if (!virtualizer) return;
    const { index } = details;
    if (index < 0 || index >= virtualizer.options.count) return;
    queueMicrotask(() => virtualizer.scrollToIndex(index, { align: "auto" }));
  }, []);

  const baseItems = useMemo(() => {
    const base = loadedOptions;
    const filteredBase = filterOption ? base.filter(filterOption) : base;
    // An empty `base` in infinite mode means the server found zero matches for the query. Pinning
    // would keep already-selected rows visible anyway, hiding that the search matched nothing
    // (e.g. suppressing a query-driven "create new" affordance keyed off an empty list).
    //
    // Also filter the pinned snapshot — a `filterOption` that excludes selected ids (e.g.
    // `search-input`'s chips) should keep them out even when pinned; other callers' `filterOption`
    // doesn't touch selected ids, so this is a no-op for them.
    const pinned =
      isInfinite && base.length === 0 ? [] : filterOption ? pinnedSelected.filter(filterOption) : pinnedSelected;
    if (!headerItems?.length)
      return shouldPinSelected ? pinSelected(filteredBase, pinned, getOptionValue) : filteredBase;
    // Exclude header items from the main list so they don't appear twice, then pin selected below them.
    const headerKeys = new Set(headerItems.map(getOptionValue));
    const rest = filteredBase.filter((item) => !headerKeys.has(getOptionValue(item)));
    return [...headerItems, ...(shouldPinSelected ? pinSelected(rest, pinned, getOptionValue) : rest)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInfinite, loadedOptions, pinnedSelected, getOptionValue, headerItems, filterOption, shouldPinSelected]);

  // Infinite mode is server-searched, so the base-ui filter stays off (`filter={null}`) in both
  // modes and the sync query is applied here instead — that keeps `items` (what `ComboboxEmpty`
  // and the virtualizer both read) the single, already-filtered list.
  //
  // `headerItems` are pinned rows, not results: an "All projects" row has to survive a query that
  // does not match its own label, which is what the legacy `filter={keepAllRowVisible}` idiom did.
  // Pass `filterHeaderItems` to opt them back into the filter.
  const headerKeys = useMemo(() => new Set((headerItems ?? []).map(getOptionValue)), [headerItems, getOptionValue]);
  const items = useMemo(() => {
    if (isInfinite) return baseItems;
    const trimmed = syncQuery.trim();
    if (!trimmed) return baseItems;
    return baseItems.filter(
      (option) =>
        (!filterHeaderItems && headerKeys.has(getOptionValue(option))) || contains(searchTextOf(option), trimmed)
    );
  }, [isInfinite, baseItems, syncQuery, contains, searchTextOf, headerKeys, filterHeaderItems, getOptionValue]);

  // Keyboard moves walk past disabled rows instead of parking on a row Enter cannot pick.
  const skipDisabledRow = useSkipDisabledRows({ isOpen, items, getOptionDisabled });
  const handleHighlight = useCallback(
    (item: unknown, details: { index: number; reason: string }) => {
      handleItemHighlighted(item, details);
      skipDisabledRow(details.index, details.reason);
    },
    [handleItemHighlighted, skipDisabledRow]
  );

  // In ids mode this is the caller's own list, unresolved ids included — base-ui operates on it
  // directly, so nothing an option lookup could not find can be lost from `onChange`.
  const selectedIds = useMemo(() => valueIds ?? selected.map(getOptionValue), [valueIds, selected, getOptionValue]);

  // The work an open or a close has to do, whoever triggered it. Runs synchronously on the base-ui
  // event so the pinned snapshot is in place for the same render that opens the list.
  const appliedOpenRef = useRef(false);
  const applyOpenSideEffects = useCallback(
    (open: boolean) => {
      appliedOpenRef.current = open;
      isOpenRef.current = open;
      if (open) {
        setIsEngineMounted(true);
        setPinnedSelected(selected);
        if (isInfinite) onInfiniteOpen();
      } else {
        if (isInfinite) onInfiniteClose();
        else setSyncQuery("");
        onClose?.();
      }
    },
    [isInfinite, onInfiniteOpen, onInfiniteClose, onClose, selected]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Uncontrolled: the event IS the state change, so the side effects run synchronously with it
      // and the pinned snapshot is in place for the same render that opens the list.
      //
      // Controlled: the caller may refuse the change (a filter row that pins `open` through an
      // Escape). Applying the side effects here would clear the infinite list, reset the query and
      // fire `onClose` for a popup that never closed — so the reconciling effect below applies them
      // if and when `open` actually moves, and a vetoed close is a no-op.
      if (!isOpenControlled) {
        applyOpenSideEffects(open);
        setUncontrolledOpen(open);
      }
      onOpenChange?.(open);
    },
    [applyOpenSideEffects, isOpenControlled, onOpenChange]
  );

  const activate = useCallback(() => {
    setIsEngineMounted(true);
    handleOpenChange(true);
  }, [handleOpenChange]);

  // A controlled `open` emits no base-ui event when it is flipped from outside — and, per
  // `handleOpenChange` above, runs none of the side effects when base-ui asks — so for a controlled
  // root this effect is where all of the open/close work happens. `appliedOpenRef` keeps it a no-op
  // for every change that already went through `handleOpenChange` (the uncontrolled path).
  useEffect(() => {
    if (appliedOpenRef.current !== isOpen) applyOpenSideEffects(isOpen);
  }, [isOpen, applyOpenSideEffects]);

  // `defaultOpen` runs the normal open path once on mount rather than seeding the state, so the
  // open-time work (pin the selection, kick off the first infinite fetch) happens exactly as it does
  // for a user-driven open. Ignored when `open` is controlled — that value already says everything.
  const hasAutoOpened = useRef(false);
  useEffect(() => {
    if (!defaultOpen || isOpenControlled || hasAutoOpened.current) return;
    hasAutoOpened.current = true;
    handleOpenChange(true);
  }, [defaultOpen, isOpenControlled, handleOpenChange]);

  // Lets content rendered inside the dropdown close it programmatically, running the same path a
  // user-driven close would (see `handleOpenChange`) instead of one triggered by base-ui.
  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);

  const handleQueryChange = useCallback(
    (next: string) => {
      // A new query is a new list, so whatever was highlighted no longer is. Base UI clears its own
      // highlight here too; tracking it ourselves keeps `onSearchSubmit` correct in the one frame
      // between the keystroke and base-ui's own `onItemHighlighted(-1)`.
      highlightedIndexRef.current = -1;
      if (isInfinite) onSearchChange(next);
      else setSyncQuery(next);
    },
    [isInfinite, onSearchChange]
  );

  // Enter with nothing to select. Only fires when there is a query and base-ui would do nothing
  // with it: no row is highlighted, or the query matched no option at all. `preventDefault` keeps
  // the key off an enclosing form's submit, and the popup stays open so the caller can act on it.
  //
  // Keeping it open needs base-ui's own opt-out, not `preventDefault`. Both handlers are the same
  // merged listener on the same input (`mergeEventHandlers`, @base-ui/react/merge-props): ours runs
  // first, and base-ui's runs after it unless the event was marked with `preventBaseUIHandler()`.
  // Base UI's Enter branch with no active index is `setOpen(false)` — exactly our submit case — so
  // without the opt-out the popup closes on the same keystroke and `applyOpenSideEffects` wipes the
  // query. The flag is set per event, and we return early in every non-submit case, so this
  // suppresses base-ui for that one keystroke only.
  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!onSearchSubmit || event.key !== "Enter" || event.nativeEvent.isComposing) return;
      const submitted = event.currentTarget.value.trim();
      if (!submitted) return;
      if (highlightedIndexRef.current >= 0 && items.length > 0) return;
      event.preventDefault();
      event.stopPropagation();
      (event as unknown as { preventBaseUIHandler?: () => void }).preventBaseUIHandler?.();
      onSearchSubmit(submitted);
    },
    [onSearchSubmit, items.length]
  );

  const ctxValue = useMemo<SelectContextValue<unknown>>(
    () => ({
      selected: selected as unknown[],
      multiple,
      isOpen,
      placeholder,
      getOptionValue: getOptionValue as (o: unknown) => string,
      getOptionLabel: labelOf as (o: unknown) => string,
      getOptionIcon: getOptionIcon as ((o: unknown) => ReactNode) | undefined,
      renderOption: renderOption as ((o: unknown) => ReactNode) | undefined,
      renderChip: renderChip as ((o: unknown) => ReactNode) | undefined,
      search: {
        query,
        onChange: handleQueryChange,
        placeholder: searchPlaceholder,
        onKeyDown: onSearchSubmit ? handleSearchKeyDown : undefined,
      },
      close,
    }),
    [
      selected,
      multiple,
      isOpen,
      placeholder,
      getOptionValue,
      labelOf,
      getOptionIcon,
      renderOption,
      renderChip,
      query,
      handleQueryChange,
      searchPlaceholder,
      onSearchSubmit,
      handleSearchKeyDown,
      close,
    ]
  );

  const mount = useCallback(() => setIsEngineMounted(true), []);

  const engineValue = useMemo<SelectEngineContextValue>(
    () => ({ mounted: isEngineMounted, activate, mount, disabled }),
    [isEngineMounted, activate, mount, disabled]
  );

  // Nested editors (e.g. properties overflow menu) can opt into left/right placement via context
  // so callers don't have to thread side/align through every property-select wrapper.
  const dropdownPlacement = useSelectDropdownPlacement();

  // Ruling 28's sibling problem, one level up: propel's positioner is `z-50` and `ComboboxContent`
  // exposes neither a z axis nor its portal container, so a Select opened from inside a
  // higher-stacked floating panel would render behind it. The popup's own `z-index` cannot help —
  // the positioner is the positioned ancestor — so the value goes on that element directly, through
  // a hidden sentinel whose callback ref fires exactly when the portaled popup mounts (an effect
  // runs a commit too early: base-ui's portal node is created first and filled after). No restore
  // is needed: the positioner unmounts with the popup. Delete this once propel grows the axis.
  const applyPositionerZIndex = useCallback(
    (node: HTMLSpanElement | null) => {
      if (positionerZIndex === undefined || !node) return;
      const positioner = node.closest("[data-select-popup]")?.parentElement;
      if (positioner instanceof HTMLElement) positioner.style.zIndex = String(positionerZIndex);
    },
    [positionerZIndex]
  );

  const searchLabel = t("common.search.label");
  const popupLabel = searchPlaceholder ?? placeholder ?? t("common.options");
  const resolvedEmptyMessage = typeof emptyMessage === "function" ? emptyMessage(query) : emptyMessage;
  const isPlainEmptyMessage = typeof resolvedEmptyMessage === "string" || typeof resolvedEmptyMessage === "number";
  const isLoading = isInfinite && infinite.isLoading;
  const loadError = isInfinite ? infinite.error : null;
  // A failed load is not an empty list: the empty row and the skeleton stand down so the error row
  // — and its retry — is what the panel says.
  const hasLoadError = loadError !== null && loadError !== undefined;
  // Whether the LIST stands down with them. A failed first load or search has nothing left to show,
  // so the error row replaces it. A failed *append* does: every page that loaded is still there and
  // still selectable, and dropping those rows would cost the user more than the failure did — the
  // rows they were reading vanish, and the only way back is a refetch from page 1. So the error row
  // joins the list instead of replacing it, and Retry re-requests the page that failed.
  const hasListError = hasLoadError && (isInfinite ? infinite.errorKind : null) !== "append";
  // Resolved only once there IS an error: a render-prop caller reads off the error object.
  const resolvedErrorMessage = !hasLoadError
    ? null
    : typeof errorMessage === "function"
      ? errorMessage(loadError)
      : (errorMessage ?? t("common.errors.default.message"));

  // Propel's `search` slot is the panel's whole sticky header region — it renders above the
  // scroller, not inside it — so the caller's `header` chrome rides along with the search field
  // there rather than as the list's first row. That is what keeps it outside the scroll area and
  // out of reach of the query filter, which only ever sees `items`.
  const searchSlot =
    showSearch || header ? (
      <>
        {showSearch ? (
          <ComboboxSearch
            placeholder={searchPlaceholder ?? searchLabel}
            aria-label={popupLabel}
            onKeyDown={onSearchSubmit ? handleSearchKeyDown : undefined}
          />
        ) : null}
        {header}
      </>
    ) : undefined;

  const content = (
    <>
      {children}
      <ComboboxContent
        data-select-popup=""
        aria-label={popupLabel}
        sizing={contentSizing}
        side={dropdownPlacement?.side}
        align={dropdownPlacement?.align}
        data-prevent-outside-click
        search={searchSlot}
        footer={footer}
      >
        {positionerZIndex === undefined ? null : <span hidden ref={applyPositionerZIndex} />}
        {/* Both regions stay mounted (base-ui announces their content politely); their chrome
            collapses while childless. */}
        {/* One line for every fetch that replaces the list — the first open and each new query
            alike. Propel's status row brings its own chrome, so the message goes in as plain text. */}
        <ComboboxStatus>{hasLoadError || !isLoading ? null : (searchingMessage ?? t("searching"))}</ComboboxStatus>
        {hasLoadError ? (
          <div role="alert" className="flex flex-col items-center gap-1 px-2 py-1.5">
            <span className="text-body-xs-regular text-tertiary">{resolvedErrorMessage}</span>
            <Button variant="secondary" size="xs" stretch="auto" label={t("common.retry")} onClick={infinite.onRetry} />
          </div>
        ) : null}
        {/* A plain string is the shared "no results" row and wears propel's empty chrome. A caller
            node (e.g. the inline "create label" affordance) brings its own layout, so it goes
            through base-ui's unstyled `Empty` instead of inheriting the row's padding and muted
            type. */}
        {isPlainEmptyMessage ? (
          <ComboboxEmpty>{isLoading || hasLoadError ? null : resolvedEmptyMessage}</ComboboxEmpty>
        ) : (
          <BaseCombobox.Empty>{isLoading || hasLoadError ? null : resolvedEmptyMessage}</BaseCombobox.Empty>
        )}
        {/* A failed reset takes the list with it: it leaves the PREVIOUS query's rows in `items`,
            and offering those under a "something went wrong" line reads as though the list is
            still live. A failed append leaves rows that are exactly what they claim to be — the
            pages that did load — so those stay, under the error row.
            The paging sentinel stands down with them, but `hasMore` is NOT what stands it down:
            the hook leaves `hasMore` true (there really are more pages, the fetch just failed), so
            the `&& !hasLoadError` below is what unmounts the sentinel, backed by `onLoadMore`'s own
            `errorKind === "append"` bail. Retry is the way on. */}
        {hasListError ? null : (
          <VirtualListBody<T>
            items={items}
            estimateItemSize={estimateItemSize}
            hasMore={isInfinite && infinite.hasMore && !hasLoadError}
            onLoadMore={onLoadMore}
            loader={<SelectOptionsSkeleton rows={1} />}
            listLabel={popupLabel}
            virtualizerRef={virtualizerRef}
            getOptionValue={getOptionValue}
            getOptionDisabled={getOptionDisabled}
            getOptionHref={getOptionHref}
            getOptionGroup={getOptionGroup}
            multiple={multiple}
            getOptionLabel={labelOf}
            getOptionIcon={getOptionIcon}
            getOptionTrailing={getOptionTrailing}
            getOptionDescription={getOptionDescription}
            renderOption={renderOption}
          />
        )}
      </ComboboxContent>
    </>
  );

  const sharedRootProps = {
    items,
    // Item values are ids, so base-ui needs no label/equality adapters; filtering is ours.
    filter: null,
    virtualized: true,
    open: isOpen,
    onOpenChange: handleOpenChange,
    onItemHighlighted: handleHighlight,
    inputValue: query,
    onInputValueChange: (next: string, details: { reason: string }) => {
      // `input-change` is the only reason base-ui reports for text the USER typed (ComboboxInput's
      // `onChange` and `onCompositionEnd`), and it has to be honoured whatever `isOpenRef` says.
      // On `variant="search-input"` the field is live while the popup is shut, and base-ui reports
      // the keystroke BEFORE it opens the popup for it — `setInputValue(value, input-change)` runs
      // ahead of `maybeOpenOnInput(...)` — so the open side effects that flip the ref have not run
      // yet. Reading the ref here dropped the first character of every search typed into a closed
      // field. A user-driven empty field is `input-change` too, so backspacing to nothing still
      // resets the list.
      if (details.reason === "input-change") {
        handleQueryChange(next);
        return;
      }
      // Every other reason is base-ui writing the field itself, and none of them is a new search:
      // `item-press` fills or clears it as a selection commits; `input-clear` is that same clear
      // arriving on its own for a multi-select whose search input lives in the popup (AriaCombobox's
      // `handleSelection` empties the field after every pick), and is also the close-time clear;
      // `escape-key` can arrive here directly on a `variant="search-input"` field that is focused
      // but already closed, where base-ui clears the query without a popup to close first; the rest
      // (`clear-press`, `none`) only mean something while the popup is open, where the field the
      // user can see really did change. `escape-key` needs no name in the guard below — it reaches
      // this line only with the popup shut, so the `!isOpenRef.current` fallback already returns.
      if (details.reason === "item-press" || details.reason === "input-clear" || !isOpenRef.current) return;
      handleQueryChange(next);
    },
    disabled,
    modal,
    children: content,
  };

  return (
    <SelectContext.Provider value={ctxValue}>
      <SelectEngineContext.Provider value={engineValue}>
        {!isEngineMounted ? (
          children
        ) : props.multiple ? (
          <Combobox<string, true>
            {...sharedRootProps}
            multiple
            value={selectedIds}
            onValueChange={(next) => props.onChange(next)}
          />
        ) : (
          <Combobox<string, false>
            {...sharedRootProps}
            value={selectedIds[0] ?? null}
            onValueChange={(next) => props.onChange(next ?? "")}
          />
        )}
      </SelectEngineContext.Provider>
    </SelectContext.Provider>
  );
}
