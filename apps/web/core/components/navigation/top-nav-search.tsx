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

import { Command } from "cmdk";
import { useState, useEffect } from "react";
import { SearchResults } from "@/components/workspace/search/results/root";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane imports
import type { TSearchResultItem } from "@plane/constants";
import { CloseIcon, SearchIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
import { useExpandableSearch } from "@/hooks/use-expandable-search";

export const TopNavSearch = observer(function TopNavSearch() {
  // states
  const [searchQuery, setSearchQuery] = useState("");
  const [flattenedSearchResults, setFlattenedSearchResults] = useState<TSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // store hooks
  const { setTopNavSearchInputRef } = usePowerK();
  // expandable search hook
  const {
    isOpen,
    containerRef,
    inputRef,
    handleClose: closePanel,
    handleMouseDown,
    handleFocus,
    openPanel,
  } = useExpandableSearch({
    onClose: () => {
      setFlattenedSearchResults([]);
      setSearchQuery("");
    },
  });
  // Register input ref with PowerK store for keyboard shortcut access
  useEffect(() => {
    setTopNavSearchInputRef(inputRef);
    return () => {
      setTopNavSearchInputRef(null);
    };
  }, [setTopNavSearchInputRef, inputRef]);

  const handleClear = () => {
    setSearchQuery("");
    setFlattenedSearchResults([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closePanel();
    }
  };

  return (
    <Command ref={containerRef} className="relative flex justify-center">
      <div
        className={cn(
          "relative flex items-center transition-all duration-300 ease-in-out z-30",
          isOpen ? "w-[554px]" : "w-[364px]"
        )}
      >
        <div
          className={cn(
            "flex items-center w-full h-7 p-2 rounded-lg bg-layer-2 border border-subtle-1 transition-colors duration-200",
            {
              "bg-layer-1": isOpen,
            }
          )}
          onClick={() => inputRef.current?.focus()}
          role="button"
        >
          <SearchIcon className="shrink-0 size-3.5 text-tertiary mr-2" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setIsSearching(true);
              if (!isOpen) openPanel();
            }}
            onMouseDown={handleMouseDown}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search"
            className="flex-1 bg-transparent text-13 text-primary placeholder-custom-text-350 outline-none min-w-0"
          />
          {searchQuery && (
            <button onClick={handleClear} className="shrink-0 ml-2">
              <CloseIcon className="size-3.5 text-placeholder hover:text-primary" />
            </button>
          )}
        </div>
      </div>
      <div
        className={cn(
          "absolute -top-[6px] left-1/2 -translate-x-1/2 bg-surface-1 border border-subtle-1 rounded-md shadow-lg flex flex-col overflow-hidden z-20 transition-all duration-300 ease-in-out pt-10",
          {
            "opacity-100 w-[574px] max-h-[80vh]": isOpen,
            "opacity-0 w-0 h-0": !isOpen,
          }
        )}
      >
        {!searchQuery ? (
          <div className="flex flex-col gap-4 items-center justify-center h-full py-8">
            <div className="w-24 h-24 bg-layer-1 rounded-full flex items-center justify-center">
              <Search className="w-14 h-14 text-placeholder/40" />
            </div>
            <div className="text-center space-y-2">
              <div className="text-18 font-bold text-tertiary">Search your workspace</div>
              <div className="text-13 text-tertiary max-w-[300px]">
                Start typing to search across work items, projects, cycles, modules and more
              </div>
            </div>
          </div>
        ) : (
          <SearchResults
            query={searchQuery}
            flattenedSearchResults={flattenedSearchResults}
            handleResultClick={closePanel}
            isSearching={isSearching}
            setFlattenedSearchResults={setFlattenedSearchResults}
            setIsSearching={setIsSearching}
          />
        )}
      </div>
    </Command>
  );
});
