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
import { useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, SquarePen } from "lucide-react";
import { CloseIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
import { SidebarSearchButton } from "@/components/sidebar/search-button";

type Props = {
  searchQuery: string;
  updateSearchQuery: (value: string) => void;
  isProjectLevel?: boolean;
  isFullScreen?: boolean;
  onClick?: () => void;
};

export const Toolbar = observer(function Toolbar(props: Props) {
  const { searchQuery, updateSearchQuery, isProjectLevel = false, isFullScreen = false, onClick } = props;
  const { workspaceSlug } = useParams();
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

  return (
    <div className="flex items-center justify-between gap-2 h-8 w-full">
      {/* New */}
      {isFullScreen ? (
        <Link
          href={`/${workspaceSlug}/${isProjectLevel ? "projects/" : ""}ai-chat/`}
          className={cn(
            "flex items-center px-2 text-secondary justify-center gap-2 h-8 w-8 rounded-md shadow-raised-100 border border-strong transition-[width] ease-linear overflow-hidden disabled:bg-pi-100 disabled:border disabled:border-subtle-1 disabled:!text-tertiary",
            {
              "w-full justify-start": !isSearchOpen,
            }
          )}
        >
          <SquarePen className="shrink-0 size-4" />
          {!isSearchOpen && <span className="text-body-sm-medium text-nowrap">New chat</span>}
        </Link>
      ) : (
        <button
          type="button"
          className={cn(
            "flex items-center px-2 text-secondary justify-center gap-2 h-8 w-8 rounded-md shadow-raised-100 border border-strong transition-[width] ease-linear overflow-hidden disabled:bg-pi-100 disabled:border disabled:border-subtle-1 disabled:!text-tertiary",
            {
              "w-full justify-start": !isSearchOpen,
            }
          )}
          onClick={onClick}
        >
          <SquarePen className="shrink-0 size-4" />
          {!isSearchOpen && <span className="text-body-sm-medium text-nowrap">New chat</span>}
        </button>
      )}
      {/* Search */}
      <div className="flex items-center flex-1">
        {!isSearchOpen && (
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(true);
              inputRef.current?.focus();
            }}
          >
            <SidebarSearchButton isActive={isSearchOpen} />
          </button>
        )}

        <div
          className={cn(
            "ml-auto flex items-center justify-start gap-1 rounded-sm border border-strong bg-layer-1 text-secondary w-0 transition-[width] ease-linear overflow-hidden opacity-0",
            {
              "w-full px-2.5 py-1.5 border-strong opacity-100": isSearchOpen,
            }
          )}
        >
          <Search className="shrink-0 size-4" />
          <input
            ref={inputRef}
            className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => updateSearchQuery(e.target.value)}
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
    </div>
  );
});
