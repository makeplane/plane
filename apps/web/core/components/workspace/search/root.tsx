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

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
// ui
import type { TSearchResultItem } from "@plane/constants";
import { CloseIcon } from "@plane/propel/icons";
import { Input } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane web imports
import { SearchResults } from "@/components/workspace/search";

export const AppSearchRoot = observer(function AppSearchRoot() {
  // navigation
  const searchParams = useSearchParams();
  // states
  const [searchQuery, setSearchQuery] = useState("");
  const [flattenedSearchResults, setFlattenedSearchResults] = useState<TSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q === null) return;
    setSearchQuery(q);
  }, [searchParams]);

  return (
    <div className="size-full flex flex-col items-center transition-all duration-500 ease-out px-4 sm:px-6 pt-4">
      <div className="size-full flex flex-col relative transition-all duration-500 ease-out py-2 sm:px-2">
        <Command className="size-full flex flex-col overflow-hidden">
          <div className="shrink-0 relative flex items-center group">
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) setIsSearching(true);
              }}
              className={cn(
                "shadow-raised-100 px-10 w-full rounded-lg border-subtle-1 bg-surface-1 transition-all duration-200 focus:border-accent-strong placeholder:text-placeholder h-10"
              )}
              placeholder="Search everything in your workspace"
              autoFocus
            />
            <div className="absolute left-2.5">
              <Search
                className={cn(
                  "transition-colors duration-200",
                  "text-placeholder group-hover:text-tertiary",
                  "w-4 h-4"
                )}
              />
            </div>
            {searchQuery && (
              <div className="absolute right-2.5">
                <CloseIcon
                  className="w-4 h-4 text-placeholder hover:text-primary cursor-pointer transition-colors duration-200"
                  onClick={() => {
                    setSearchQuery("");
                    setFlattenedSearchResults([]);
                  }}
                />
              </div>
            )}
          </div>
          <SearchResults
            query={searchQuery}
            flattenedSearchResults={flattenedSearchResults}
            setFlattenedSearchResults={setFlattenedSearchResults}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            isAppSearchPage
          />
        </Command>
      </div>
    </div>
  );
});
