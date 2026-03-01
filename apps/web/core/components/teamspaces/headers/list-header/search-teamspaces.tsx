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

import type { FC } from "react";
import { useMemo, useRef, useState } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
import { CloseIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
// plane web hooks
import { useTeamspaceFilter } from "@/plane-web/hooks/store";

export const TeamspacesListSearch = observer(function TeamspacesListSearch() {
  // hooks
  const { searchQuery, updateSearchQuery } = useTeamspaceFilter();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else setIsSearchOpen(false);
    }
  };

  const debouncedUpdateSearch = useMemo(
    () => debounce((value: string) => updateSearchQuery(value), 300),
    [updateSearchQuery]
  );

  return (
    <div className="flex items-center">
      {!isSearchOpen && (
        <button
          type="button"
          className="p-1.5 hover:bg-layer-1 rounded-sm text-placeholder grid place-items-center"
          onClick={() => {
            setIsSearchOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search className="size-4" />
        </button>
      )}
      <div
        className={cn(
          "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-surface-1 text-placeholder w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-30 md:w-64 px-2.5 py-1 border-subtle-1 opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="size-4" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-body-xs-regular text-primary placeholder:text-placeholder focus:outline-none"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => debouncedUpdateSearch(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={() => {
              updateSearchQuery("");
              setIsSearchOpen(false);
            }}
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});
