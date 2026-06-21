/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import type { TPageLinkSearchResult } from "@/types";

type Props = {
  searchPages: (query: string) => Promise<TPageLinkSearchResult[]>;
  onPageSelect: (page: TPageLinkSearchResult) => void;
  focusOnMount?: boolean;
};

export function PageLinkSearchPanel(props: Props) {
  const { searchPages, onPageSelect, focusOnMount = false } = props;
  const [pageQuery, setPageQuery] = useState("");
  const [pageResults, setPageResults] = useState<TPageLinkSearchResult[]>([]);
  const [isSearchingPages, setIsSearchingPages] = useState(false);
  const pageSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusOnMount) return;
    pageSearchRef.current?.focus();
  }, [focusOnMount]);

  useEffect(() => {
    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsSearchingPages(true);
      searchPages(pageQuery)
        .then((results: TPageLinkSearchResult[]) => {
          if (!isCancelled) {
            setPageResults(results);
          }
          return results;
        })
        .finally(() => {
          if (!isCancelled) {
            setIsSearchingPages(false);
          }
        });
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pageQuery, searchPages]);

  return (
    <div className="p-2">
      <input
        ref={pageSearchRef}
        type="text"
        value={pageQuery}
        placeholder="Search pages"
        onClick={(e) => e.stopPropagation()}
        className="mb-2 w-full rounded-sm border-[0.5px] border-strong bg-surface-1 px-2 py-2 text-11 outline-none placeholder:text-placeholder"
        onChange={(e) => setPageQuery(e.target.value)}
      />
      <div className="max-h-40 overflow-y-auto">
        {isSearchingPages && <p className="px-2 py-1 text-11 text-tertiary">Searching...</p>}
        {!isSearchingPages && pageResults.length === 0 && (
          <p className="px-2 py-1 text-11 text-tertiary">No pages found</p>
        )}
        {pageResults.map((page) => (
          <button
            key={page.id}
            type="button"
            className="flex w-full rounded-sm px-2 py-1.5 text-left text-11 text-primary transition-colors hover:bg-layer-1"
            onClick={(e) => {
              e.stopPropagation();
              onPageSelect(page);
            }}
          >
            {page.name}
          </button>
        ))}
      </div>
    </div>
  );
}
