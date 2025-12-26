import { useCallback, useRef, useState } from "react";
import { debounce } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { useTranslation } from "@plane/i18n";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { useSticky } from "@/hooks/use-stickies";
import { IconButton } from "@plane/propel/icon-button";

export const StickySearch = observer(function StickySearch() {
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
        <IconButton
          variant="ghost"
          size="lg"
          className="-mr-2"
          icon={SearchIcon}
          onClick={() => {
            setIsSearchOpen(true);
            inputRef.current?.focus();
          }}
        />
      )}
      <div
        className={cn(
          "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent text-placeholder w-0 transition-[width] ease-linear overflow-hidden opacity-0",
          {
            "w-30 md:w-64 px-2.5 py-1.5 border-subtle opacity-100": isSearchOpen,
          }
        )}
      >
        <SearchIcon className="shrink-0 size-3.5" />
        <input
          ref={inputRef}
          className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
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
            <CloseIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
});
