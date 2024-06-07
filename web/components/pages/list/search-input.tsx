import { FC, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Search, X } from "lucide-react";
import { cn } from "@/helpers/common.helper";
import { useProjectPages } from "@/hooks/store";
import useOutsideClickDetector from "@/hooks/use-outside-click-detector";

export const PageSearchInput: FC = observer(() => {
  // hooks
  const {
    filters: { searchQuery },
    updateFilters,
  } = useProjectPages();
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateFilters("searchQuery", "");
      else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  return (
    <>
      {!isSearchOpen && (
        <button
          type="button"
          className="flex-shrink-0 hover:bg-custom-background-80 rounded text-custom-text-400 relative flex justify-center items-center w-6 h-6"
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
          placeholder="Search pages"
          value={searchQuery}
          onChange={(e) => updateFilters("searchQuery", e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={() => {
              updateFilters("searchQuery", "");
              setIsSearchOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </>
  );
});
