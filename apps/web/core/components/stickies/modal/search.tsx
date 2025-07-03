"use client";

import { FC, useCallback, useRef, useState } from "react";
import { debounce } from "lodash";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search, X } from "lucide-react";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useSticky } from "@/hooks/use-stickies";

export const StickySearch: FC = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { searchQuery, updateSearchQuery, fetchWorkspaceStickies } = useSticky();
  const { t } = useTranslation();
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") {
        updateSearchQuery("");
        fetchStickies();
      } else setIsSearchOpen(false);
    }
  };

  const fetchStickies = async () => {
    await fetchWorkspaceStickies(workspaceSlug.toString());
  };

  const debouncedSearch = useCallback(
    debounce(async () => {
      await fetchStickies();
    }, 500),
    [fetchWorkspaceStickies]
  );

  return (
    <div className="flex items-center mr-2 my-auto">
      {!isSearchOpen && (
        <button
          type="button"
          className="-mr-1 p-1 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
          onClick={() => {
            setIsSearchOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Search className=" size-4 " />
        </button>
      )}
      <div
        className={cn(
          "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-30 md:w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
          placeholder={t("stickies.search_placeholder")}
          value={searchQuery}
          onChange={(e) => {
            updateSearchQuery(e.target.value);
            debouncedSearch();
          }}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={() => {
              updateSearchQuery("");
              setIsSearchOpen(false);
              fetchStickies();
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});
