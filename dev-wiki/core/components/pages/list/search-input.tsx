import { FC, useState, useRef, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import { Search, X } from "lucide-react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  searchQuery: string;
  updateSearchQuery: (val: string) => void;
};

export const PageSearchInput: FC<Props> = (props) => {
  const { searchQuery, updateSearchQuery } = props;
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && localSearchQuery.trim() === "") setIsSearchOpen(false);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateSearchQuery = useCallback(
    debounce((value: string) => {
      updateSearchQuery(value);
    }, 300),
    [updateSearchQuery]
  );

  // Update local state immediately and trigger debounced store update
  const handleQueryChange = (value: string) => {
    setLocalSearchQuery(value);
    debouncedUpdateSearchQuery(value);

    // Auto-open search when there's content
    if (value.trim() !== "") setIsSearchOpen(true);
  };

  // Clean up the debounced function on unmount
  useEffect(() => () => debouncedUpdateSearchQuery.cancel(), [debouncedUpdateSearchQuery]);

  // Set initial local state from props
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (localSearchQuery && localSearchQuery.trim() !== "") {
        handleQueryChange("");
      } else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className="flex">
      {!isSearchOpen && (
        <button
          type="button"
          className="flex-shrink-0 hover:bg-custom-background-80 rounded text-custom-text-400 relative flex justify-center items-center w-6 h-6 my-auto"
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
          "flex items-center justify-start rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-64 px-2.5 py-1.5 border-custom-border-200 opacity-100": isSearchOpen,
          }
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none ml-2"
          placeholder="Search pages"
          value={localSearchQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="grid place-items-center"
            onClick={() => {
              handleQueryChange("");
              setIsSearchOpen(false);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
