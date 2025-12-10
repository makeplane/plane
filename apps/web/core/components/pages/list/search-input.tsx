import { useState, useRef, useMemo } from "react";
import { Search } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { CloseIcon } from "@plane/propel/icons";
// plane helpers
// helpers
import { cn } from "@plane/utils";

type Props = {
  searchQuery: string;
  updateSearchQuery: (val: string) => void;
};

export function PageSearchInput(props: Props) {
  const { searchQuery, updateSearchQuery } = props;
  // states
  const [manuallyOpened, setManuallyOpened] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Derive isSearchOpen from searchQuery and manual state
  const isSearchOpen = useMemo(
    () => searchQuery.trim() !== "" || manuallyOpened,
    [searchQuery, manuallyOpened]
  );
  
  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setManuallyOpened(false);
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (searchQuery && searchQuery.trim() !== "") updateSearchQuery("");
      else {
        setManuallyOpened(false);
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className="flex">
      {!isSearchOpen && (
        <button
          type="button"
          className="shrink-0 hover:bg-layer-transparent-hover rounded-sm text-placeholder relative flex justify-center items-center w-6 h-6 my-auto"
          onClick={() => {
            setManuallyOpened(true);
            inputRef.current?.focus();
          }}
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      )}
      <div
        className={cn(
          "flex items-center justify-start rounded-md border border-transparent text-placeholder w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-64 px-2.5 py-1.5 border-subtle opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none ml-2"
          placeholder="Search pages"
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
              setManuallyOpened(false);
            }}
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
