/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { InfiniteVirtualList, VirtualList } from "../virtual-list";
import type { TPaginatedResponse } from "@plane/types";
// local imports
import { MenuSearchInput } from "./menu-search-input";
import { MenuRow } from "./menu-parts";
import { MENU_LIST_CLASSNAME, SELECT_OPTION_ROW_HEIGHT } from "./select.constants";
import { SelectOptionsSkeleton } from "./skeleton";
import type { SelectPaginationParams } from "./types";
import { useInfiniteOptions } from "./use-infinite-options";
import { pinSelected } from "./utils";

/** All user-visible copy — required so the shared package never ships untranslated defaults. */
export type SelectListMessages = {
  searchPlaceholder: string;
  empty: string;
  /** Shown with a retry action when a paginated fetch fails. */
  error: string;
  retry: string;
};

type SelectListCommonProps<T> = {
  getOptionValue: (option: T) => string;
  /** Searchable label — client search (static mode) matches against it. */
  getOptionLabel: (option: T) => string;
  renderOption: (option: T) => React.ReactNode;
  onSelect: (value: string) => void;
  getOptionDisabled?: (option: T) => boolean;
  messages: SelectListMessages;
  /** Hide the search input — for short fixed lists where searching is noise. Default true. */
  showSearch?: boolean;
};

export type SelectListBodyProps<T> = SelectListCommonProps<T> &
  (
    | {
        /** Server-paged source — same contract as `Select`'s infinite mode. */
        infinite: true;
        getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<T[]>>;
        /** Caller-resolved selected options pinned above the paged rows, so an off-page selection
         * stays visible and deselectable. Adopted once per mount (mount = open) — the SelectRoot
         * snapshot rule — so rows don't reorder mid-interaction. */
        pinnedOptions?: T[];
      }
    | {
        /** Resident list — client-searched and virtualized. */
        infinite?: false;
        getValues: () => T[];
      }
  );

/**
 * The `Select` popup body without its trigger/popup shell: search on top, bounded virtualized
 * list, skeleton / empty / error+retry states — renderable inline inside any flyout panel
 * (NestedSubmenu, cascade menus). Static and paginated modes mirror `Select`'s sync/infinite
 * paths exactly.
 */
export function SelectListBody<T>(props: SelectListBodyProps<T>) {
  return props.infinite === true ? <InfiniteListBody {...props} /> : <StaticListBody {...props} />;
}

/** Search input + content column shared by both modes. */
function ListShell(props: {
  query: string;
  onQueryChange: (query: string) => void;
  searchPlaceholder: string;
  showSearch: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {props.showSearch && (
        <MenuSearchInput value={props.query} onChange={props.onQueryChange} placeholder={props.searchPlaceholder} />
      )}
      {props.children}
    </div>
  );
}

type OptionRowProps<T> = Pick<
  SelectListCommonProps<T>,
  "onSelect" | "getOptionValue" | "getOptionDisabled" | "renderOption"
>;

function OptionRow<T>(props: OptionRowProps<T> & { option: T }) {
  const { option, onSelect, getOptionValue, getOptionDisabled, renderOption } = props;
  const disabled = getOptionDisabled?.(option) ?? false;
  return (
    <MenuRow
      disabled={disabled}
      onClick={() => onSelect(getOptionValue(option))}
      render={<button type="button" disabled={disabled} />}
    >
      {renderOption(option)}
    </MenuRow>
  );
}

function StaticListBody<T>(props: SelectListCommonProps<T> & { getValues: () => T[] }) {
  const { getOptionValue, getOptionLabel, onSelect, getOptionDisabled, renderOption, messages } = props;
  // states
  const [query, setQuery] = useState("");
  // derived values
  const options = props.getValues();
  const trimmedQuery = query.trim().toLowerCase();
  const visible = trimmedQuery
    ? options.filter((option) => getOptionLabel(option).toLowerCase().includes(trimmedQuery))
    : options;

  return (
    <ListShell
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={messages.searchPlaceholder}
      showSearch={props.showSearch ?? true}
    >
      {visible.length === 0 ? (
        <p className="px-2 py-1.5 text-body-xs-regular text-tertiary">{messages.empty}</p>
      ) : (
        <VirtualList
          count={visible.length}
          estimateSize={SELECT_OPTION_ROW_HEIGHT}
          getItemKey={(index) => getOptionValue(visible[index])}
          className={MENU_LIST_CLASSNAME}
        >
          {(virtualItem) => (
            <OptionRow
              option={visible[virtualItem.index]}
              onSelect={onSelect}
              getOptionValue={getOptionValue}
              getOptionDisabled={getOptionDisabled}
              renderOption={renderOption}
            />
          )}
        </VirtualList>
      )}
    </ListShell>
  );
}

function ErrorRetryRow(props: { message: string; retryLabel: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-1 px-2 py-1.5">
      <p className="text-body-xs-regular text-tertiary">{props.message}</p>
      <button type="button" onClick={props.onRetry} className="text-body-xs-medium text-accent-primary">
        {props.retryLabel}
      </button>
    </div>
  );
}

function InfiniteListBody<T>(
  props: SelectListCommonProps<T> & {
    getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<T[]>>;
    pinnedOptions?: T[];
  }
) {
  const { getOptionValue, onSelect, getOptionDisabled, renderOption, messages, pinnedOptions } = props;
  const { items, hasMore, query, isLoading, error, onSearchChange, onLoadMore, onOpen, onRetry } = useInfiniteOptions(
    props.getValues,
    getOptionValue
  );

  // Mount = open (flyout content only mounts while open) — fetch page 1 once.
  useEffect(() => {
    onOpen();
  }, [onOpen]);

  // Selection snapshot, adopted from the first non-empty resolution (the caller may resolve the
  // selected rows async). Frozen after that so rows don't reorder mid-interaction; deselected rows
  // drop out on the next mount, matching SelectRoot's open-time snapshot rule.
  const [pinnedSelected, setPinnedSelected] = useState<T[]>([]);
  useEffect(() => {
    if (pinnedSelected.length === 0 && pinnedOptions?.length) setPinnedSelected(pinnedOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- adopt-once; later selection changes must not re-pin
  }, [pinnedOptions]);
  // Same empty-base rule as SelectRoot: zero server matches must read as "nothing matched", not a
  // list of already-selected rows.
  const listItems = items.length === 0 ? items : pinSelected(items, pinnedSelected, getOptionValue);

  return (
    <ListShell
      query={query}
      onQueryChange={onSearchChange}
      searchPlaceholder={messages.searchPlaceholder}
      showSearch={props.showSearch ?? true}
    >
      {items.length === 0 ? (
        isLoading ? (
          <SelectOptionsSkeleton rows={3} />
        ) : error != null ? (
          <ErrorRetryRow message={messages.error} retryLabel={messages.retry} onRetry={onRetry} />
        ) : (
          <p className="px-2 py-1.5 text-body-xs-regular text-tertiary">{messages.empty}</p>
        )
      ) : (
        <>
          <InfiniteVirtualList
            count={listItems.length}
            estimateSize={SELECT_OPTION_ROW_HEIGHT}
            getItemKey={(index) => getOptionValue(listItems[index])}
            // A failed append leaves `count` unchanged, so the observer never re-arms — suppress the
            // sentinel while an error is pending and surface the footer's retry instead.
            hasMore={error == null && hasMore}
            onLoadMore={() => onLoadMore()}
            // Short panel: InfiniteVirtualList's 200px default would fetch page 2 on open.
            loadMoreMargin="0px"
            loaderRows={1}
            loader={<SelectOptionsSkeleton rows={1} />}
            loaderClassName="p-1"
            className={MENU_LIST_CLASSNAME}
          >
            {(virtualItem) => (
              <OptionRow
                option={listItems[virtualItem.index]}
                onSelect={onSelect}
                getOptionValue={getOptionValue}
                getOptionDisabled={getOptionDisabled}
                renderOption={renderOption}
              />
            )}
          </InfiniteVirtualList>
          {error != null && <ErrorRetryRow message={messages.error} retryLabel={messages.retry} onRetry={onRetry} />}
        </>
      )}
    </ListShell>
  );
}
