import { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
import { EViewAccess, TViewFilterProps, TViewFilters } from "@plane/types";
// components
import { FilterCreatedBy, FilterCreatedDate } from "@/components/common/filters";
import { FilterOption } from "@/components/issues";
// constants
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { FilterByAccess } from "@/plane-web/components/views/filters/access-filter";

type Props = {
  filters: TViewFilters;
  handleFiltersUpdate: <T extends keyof TViewFilters>(filterKey: T, filterValue: TViewFilters[T]) => void;
  memberIds?: string[] | undefined;
};

export const ViewFiltersSelection: React.FC<Props> = observer((props) => {
  const { filters, handleFiltersUpdate, memberIds } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // store
  const { isMobile } = usePlatformOS();

  // handles filter update
  const handleFilters = (key: keyof TViewFilterProps, value: boolean | string | EViewAccess | string[]) => {
    const currValues = (filters.filters?.[key] ?? []) as (string | EViewAccess)[];

    if (typeof currValues === "boolean" && typeof value === "boolean") return;

    if (Array.isArray(currValues)) {
      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!currValues.includes(val)) currValues.push(val);
          else currValues.splice(currValues.indexOf(val), 1);
        });
      } else if (typeof value !== "boolean") {
        if (currValues?.includes(value)) currValues.splice(currValues.indexOf(value), 1);
        else currValues.push(value);
      }
    }

    handleFiltersUpdate("filters", {
      ...filters.filters,
      [key]: currValues,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-custom-background-100 p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-1.5 py-1 text-xs">
          <Search className="text-custom-text-400" size={12} strokeWidth={2} />
          <input
            type="text"
            className="w-full bg-custom-background-90 outline-none placeholder:text-custom-text-400"
            placeholder="Search"
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
            autoFocus={!isMobile}
          />
          {filtersSearchQuery !== "" && (
            <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
              <X className="text-custom-text-300" size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <div className="h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5 vertical-scrollbar scrollbar-sm">
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

        {/* access / view type */}
        <FilterByAccess
          appliedFilters={filters.filters?.view_type}
          handleUpdate={(val: string | string[]) => handleFilters("view_type", val)}
          searchQuery={filtersSearchQuery}
          accessFilters={[
            { key: EViewAccess.PRIVATE, value: "Private" },
            { key: EViewAccess.PUBLIC, value: "Public" },
          ]}
        />

        {/* created date */}
        <div className="py-2">
          <FilterCreatedDate
            appliedFilters={filters.filters?.created_at ?? null}
            handleUpdate={(val: string | string[]) => handleFilters("created_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* created by */}
        <div className="py-2">
          <FilterCreatedBy
            appliedFilters={filters.filters?.owned_by ?? null}
            handleUpdate={(val) => handleFilters("owned_by", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>
      </div>
    </div>
  );
});
