import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { Search, X } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProjectView } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

export const ViewListHeader = observer(() => {
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "" ? true : false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  const { searchQuery, updateSearchQuery } = useProjectView();

  // handlers
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  return (
    <div className="h-full flex items-center gap-2">
      <div className="flex items-center">
        {!isSearchOpen && (
          <button
            type="button"
            className="-mr-1 p-2 hover:bg-custom-background-80 rounded text-custom-text-400 grid place-items-center"
            onClick={() => {
              setIsSearchOpen(true);
              inputRef.current?.focus();
            }}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        )}
        <div
          className={cn(
            "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
            {
              "w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
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
