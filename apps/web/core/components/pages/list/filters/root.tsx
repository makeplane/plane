import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
import type { TPageFilterProps, TPageFilters } from "@plane/types";
// components
import { FilterCreatedDate } from "@/components/common/filters/created-at";
import { FilterCreatedBy } from "@/components/common/filters/created-by";
import { FilterOption } from "@/components/issues/issue-layouts/filters";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  filters: TPageFilters;
  handleFiltersUpdate: <T extends keyof TPageFilters>(filterKey: T, filterValue: TPageFilters[T]) => void;
  memberIds?: string[] | undefined;
};

export const PageFiltersSelection = observer(function PageFiltersSelection(props: Props) {
  const { filters, handleFiltersUpdate, memberIds } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = usePlatformOS();

  useEffect(() => {
    if (!isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  const handleFilters = (key: keyof TPageFilterProps, value: boolean | string | string[]) => {
    const newValues = filters.filters?.[key] ?? [];

    if (typeof newValues === "boolean" && typeof value === "boolean") return;

    if (Array.isArray(newValues)) {
      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else if (typeof value === "string") {
        if (newValues?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }
    }

    handleFiltersUpdate("filters", {
      ...filters.filters,
      [key]: newValues,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-layer-transparent p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-1.5 py-1 text-11">
          <SearchIcon className="text-placeholder" width={12} height={12} strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            className="w-full outline-none placeholder:text-placeholder"
            placeholder="Search"
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
          />
          {filtersSearchQuery !== "" && (
            <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
              <CloseIcon className="text-tertiary" height={12} width={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <div className="h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5 vertical-scrollbar scrollbar-sm">
        <div className="py-2">
          <FilterOption
            isChecked={!!filters.filters?.favorites}
            onClick={() =>
              handleFiltersUpdate("filters", {
                ...filters.filters,
                favorites: !filters.filters?.favorites,
              })
            }
            title="Favorites"
          />
        </div>

        {/* created date */}
        <div className="py-2">
          <FilterCreatedDate
            appliedFilters={filters.filters?.created_at ?? null}
            handleUpdate={(val) => handleFilters("created_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* created by */}
        <div className="py-2">
          <FilterCreatedBy
            appliedFilters={filters.filters?.created_by ?? null}
            handleUpdate={(val) => handleFilters("created_by", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>
      </div>
    </div>
  );
});
