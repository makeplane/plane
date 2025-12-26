import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// icons
import { ListFilter } from "lucide-react";
import { useOutsideClickDetector } from "@plane/hooks";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
// plane helpers
// helpers
import { cn } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";
import { FiltersDropdown } from "../issues/issue-layouts/filters";
import { ViewFiltersSelection } from "./filters/filter-selection";
import { ViewOrderByDropdown } from "./filters/order-by";
import { IconButton } from "@plane/propel/icon-button";

export const ViewListHeader = observer(function ViewListHeader() {
  // states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // refs
  const inputRef = useRef<HTMLInputElement>(null);
  // store hooks
  const { filters, updateFilters } = useProjectView();
  const {
    project: { projectMemberIds },
  } = useMember();

  // handlers
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      if (filters?.searchQuery && filters?.searchQuery.trim() !== "") {
        updateFilters("searchQuery", "");
      } else {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }
  };

  // outside click detector hook
  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && filters?.searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (filters?.searchQuery.trim() !== "") setIsSearchOpen(true);
  }, [filters?.searchQuery]);

  return (
    <div className="h-full flex items-center gap-2">
      <div className="flex items-center">
        {!isSearchOpen && (
          <IconButton
            variant="ghost"
            size="lg"
            className="-mr-1"
            onClick={() => {
              setIsSearchOpen(true);
              inputRef.current?.focus();
            }}
            icon={SearchIcon}
          />
        )}
        <div
          className={cn(
            "ml-auto flex items-center justify-start gap-1 rounded-md border border-transparent bg-surface-1 text-placeholder w-0 transition-[width] ease-linear overflow-hidden opacity-0",
            {
              "w-64 px-2.5 py-1.5 border-subtle opacity-100": isSearchOpen,
            }
          )}
        >
          <SearchIcon className="h-3.5 w-3.5" />
          <input
            ref={inputRef}
            className="w-full max-w-[234px] border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
            placeholder="Search"
            value={filters?.searchQuery}
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
              <CloseIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <ViewOrderByDropdown
          sortBy={filters.sortBy}
          sortKey={filters.sortKey}
          onChange={(val) => {
            if (val.key) updateFilters("sortKey", val.key);
            if (val.order) updateFilters("sortBy", val.order);
          }}
        />
        <FiltersDropdown
          icon={<ListFilter className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={false}
        >
          <ViewFiltersSelection
            filters={filters}
            handleFiltersUpdate={updateFilters}
            memberIds={projectMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
