/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash-es";
import type { TPaginatedResponse } from "@plane/types";
import { SELECT_SEARCH_DEBOUNCE_MS } from "./select.constants";
import type { SelectPaginationParams } from "./types";
import { appendUnique } from "./utils";

/**
 * Orchestrates the infinite/paginated data source: accumulates pages, dedupes appended rows,
 * tracks `hasMore`, debounces server-side search, and surfaces `error` + `onRetry`. Returns
 * handlers for any infinite list surface (propel's infinite Combobox.Options, SelectListBody).
 */
export function useInfiniteOptions<T>(
  getValues: (params: SelectPaginationParams) => Promise<TPaginatedResponse<T[]>>,
  getOptionValue: (option: T) => string
) {
  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Which fetch failed. A `reset` (first open, search, retry-from-the-top) leaves nothing to show,
  // so the surface replaces the list with the error row; an `append` (the scroll sentinel's next
  // page) leaves every page that did load intact, and blanking those would be a worse outcome than
  // the failure itself — the user loses rows they were reading, and the only way back is a refetch
  // from page 1.
  const [errorKind, setErrorKind] = useState<"reset" | "append" | null>(null);

  // Event-time data nothing renders: the append cursor lives only in a ref.
  const nextCursorRef = useRef<string | undefined>(undefined);
  // Latest props/state in refs so the stable callbacks below never go stale and never churn.
  const getValuesRef = useRef(getValues);
  const getKeyRef = useRef(getOptionValue);
  const queryRef = useRef(query);
  useEffect(() => {
    getValuesRef.current = getValues;
    getKeyRef.current = getOptionValue;
    queryRef.current = query;
  });

  // Generation-guarded requests: a reset (new search / open) SUPERSEDES whatever is in flight —
  // its response bumps the generation, and any older response is discarded on arrival. Appends
  // stay single-flight (`inFlightRef`) so the scroll sentinel cannot stack pages. Without the
  // supersession, a reset firing mid-append was silently dropped (query shown, list unfiltered);
  // without the discard, a slow stale page could land on top of a newer search's results.
  const inFlightRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  const fetchedRef = useRef(false);
  // `errorKind` is read by two stable callbacks (`onLoadMore`, `onRetry`) that must not take a new
  // identity — the paging sentinel re-arms its IntersectionObserver whenever `onLoadMore` changes —
  // so it is mirrored into a ref, written on the same tick as the state rather than in an effect.
  const errorKindRef = useRef<"reset" | "append" | null>(null);

  const loadPage = useCallback(async (opts: { cursor?: string; search?: string; reset?: boolean }) => {
    if (inFlightRef.current !== null && !opts.reset) return;
    const generation = opts.reset ? ++generationRef.current : generationRef.current;
    inFlightRef.current = generation;
    // Every attempt clears the standing error, an append retry included — the error row stands down
    // while the request it names is in flight, and comes back only if this one fails too.
    setError(null);
    setErrorKind(null);
    errorKindRef.current = null;
    if (opts.reset) setIsLoading(true);
    try {
      const res = await getValuesRef.current({
        cursor: opts.cursor,
        search: opts.search,
      });
      if (generation !== generationRef.current) return;
      const results = res.results ?? [];
      const getKey = getKeyRef.current;
      setItems((prev) => (opts.reset ? results : appendUnique(prev, results, getKey)));
      nextCursorRef.current = res.next_cursor;
      setHasMore(Boolean(res.next_page_results && res.next_cursor));
      setError(null);
      setErrorKind(null);
    } catch (err) {
      // Swallowing this would render the empty state for a network failure. Stale failures
      // (superseded generation) are discarded like stale successes.
      if (generation === generationRef.current) {
        setError(err);
        setErrorKind(opts.reset ? "reset" : "append");
        errorKindRef.current = opts.reset ? "reset" : "append";
        // `nextCursorRef` is only advanced by a SUCCESSFUL page, so after a failed append it still
        // holds the cursor of the page that failed — which is what `onRetry` re-requests.
      }
    } finally {
      if (inFlightRef.current === generation) inFlightRef.current = null;
      if (generation === generationRef.current) setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce(
        (q: string) =>
          void loadPage({
            search: q || undefined,
            reset: true,
          }),
        SELECT_SEARCH_DEBOUNCE_MS
      ),
    [loadPage]
  );
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const onSearchChange = useCallback(
    (q: string) => {
      setQuery(q);
      // Clearing applies instantly; typing debounces.
      if (q.trim() === "") {
        debouncedSearch.cancel();
        void loadPage({ reset: true });
        return;
      }
      debouncedSearch(q);
    },
    [debouncedSearch, loadPage]
  );

  const onLoadMore = useCallback(() => {
    const cursor = nextCursorRef.current;
    if (!cursor) return;
    // A failed append leaves `hasMore` true and the sentinel on screen at the end of the rows the
    // user still has, so without this the observer would re-request the same failing page in a
    // loop. Recovery is deliberate: the error row's Retry.
    if (errorKindRef.current === "append") return;
    return loadPage({ cursor, search: queryRef.current || undefined });
  }, [loadPage]);

  const onOpen = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void loadPage({ reset: true });
  }, [loadPage]);

  /**
   * The recovery action after `error`. A failed APPEND re-requests that same page — the cursor is
   * still the failed one, and the pages already loaded stay where they are. A failed RESET has no
   * list left to preserve, so it re-runs the current query from page 1.
   */
  const onRetry = useCallback(() => {
    const cursor = nextCursorRef.current;
    if (errorKindRef.current === "append" && cursor) {
      void loadPage({ cursor, search: queryRef.current || undefined });
      return;
    }
    void loadPage({ search: queryRef.current || undefined, reset: true });
  }, [loadPage]);

  // Clear the search + accumulated pages on close so reopening starts fresh (unfiltered, page 1)
  // and re-arm `onOpen` to refetch. Without this the stale query + filtered list survive the close.
  // Consumers whose popup UNMOUNTS on close (flyout bodies) never need it — unmount is the reset.
  const onClose = useCallback(() => {
    debouncedSearch.cancel();
    fetchedRef.current = false;
    nextCursorRef.current = undefined;
    setQuery("");
    setItems([]);
    setHasMore(false);
    setError(null);
    setErrorKind(null);
    errorKindRef.current = null;
  }, [debouncedSearch]);

  // A reset with a live query is a SEARCH: the list has already been seen, so the surface shows a
  // "searching" line rather than the first-open skeleton. Clearing the query resets too, but with an
  // empty query — that one keeps the skeleton, since the list it rebuilds is the unfiltered one.
  const isSearching = isLoading && query.trim().length > 0;

  return {
    items,
    /**
     * Whether the server says another page exists. A failed append does NOT clear it — the page is
     * still there, the fetch just failed — so a surface that renders a paging sentinel must gate it
     * on `error` too (`hasMore && error == null`, which is what `SelectRoot` and `SelectListBody`
     * both do). `onLoadMore` bails on a standing append error as a second line of defence, so this
     * cannot loop even if a caller forgets.
     */
    hasMore,
    query,
    isLoading,
    isSearching,
    error,
    /** Whether `error` came from a first/search load or from appending the next page. */
    errorKind,
    onSearchChange,
    onLoadMore,
    onOpen,
    onRetry,
    onClose,
  };
}
