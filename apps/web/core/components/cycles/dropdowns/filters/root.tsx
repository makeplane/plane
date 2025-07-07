import { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
import { TCycleFilters, TCycleGroups } from "@plane/types";
// components
import { FilterEndDate, FilterStartDate, FilterStatus } from "@/components/cycles";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types

type Props = {
  filters: TCycleFilters;
  handleFiltersUpdate: (key: keyof TCycleFilters, value: string | string[]) => void;
  isArchived?: boolean;
};

export const CycleFiltersSelection: React.FC<Props> = observer((props) => {
  const { filters, handleFiltersUpdate, isArchived = false } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // hooks
  const { isMobile } = usePlatformOS();

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
        {/* cycle status */}
        {!isArchived && (
          <div className="py-2">
            <FilterStatus
              appliedFilters={(filters.status as TCycleGroups[]) ?? null}
              handleUpdate={(val) => handleFiltersUpdate("status", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* start date */}
        <div className="py-2">
          <FilterStartDate
            appliedFilters={filters.start_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* end date */}
        <div className="py-2">
          <FilterEndDate
            appliedFilters={filters.end_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("end_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
