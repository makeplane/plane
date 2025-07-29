"use client";

import { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, SquarePen, X } from "lucide-react";
// helpers
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  searchQuery: string;
  updateSearchQuery: (value: string) => void;
  isProjectLevel?: boolean;
};

export const Toolbar: FC<Props> = observer((props) => {
  const { searchQuery, updateSearchQuery, isProjectLevel = false } = props;
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
      <Link
        href={`/${workspaceSlug}/${isProjectLevel ? "projects/" : ""}pi-chat/new`}
        className={cn(
          "flex items-center px-3 text-custom-text-300 justify-center gap-2 h-8 w-8 rounded-lg border-[0.5px] border-custom-sidebar-border-300 transition-[width] ease-linear overflow-hidden disabled:bg-pi-100 disabled:border disabled:border-custom-border-300 disabled:!text-custom-text-300",
          {
            "w-full justify-start": !isSearchOpen,
          }
        )}
      >
        <SquarePen className="flex-shrink-0 size-4" />
        {!isSearchOpen && <span className="text-sm text-nowrap font-medium">New chat</span>}
      </Link>
      {/* Search */}
      <div className="flex items-center flex-1">
        {!isSearchOpen && (
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-lg bg-custom-background-100 text-custom-text-400 hover:text-custom-text-200 border-[0.5px] border-custom-sidebar-border-300"
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
            "ml-auto flex items-center justify-start gap-1 rounded-md border-[0.5px] border-custom-sidebar-border-300 bg-custom-background-90 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
            {
              "w-full px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
            }
          )}
        >
          <Search className="h-3.5 w-3.5" />
          <input
            ref={inputRef}
            className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
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
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
