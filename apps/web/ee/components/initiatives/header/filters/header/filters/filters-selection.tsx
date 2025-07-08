import { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
// components
import { useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { TInitiativeFilters } from "@/plane-web/types/initiative";
import { FilterLead, FilterStartDate, FilterTargetDate } from "./";
// hooks
// plane web components

type Props = {
  filters: TInitiativeFilters;
  handleFiltersUpdate: (key: keyof TInitiativeFilters, value: string | string[]) => void;
};

export const FilterSelection: React.FC<Props> = observer((props) => {
  const { filters, handleFiltersUpdate } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const {
    workspace: { workspaceMemberIds },
  } = useMember();

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
      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5">
        {/* Lead */}
        <div className="py-2">
          <FilterLead
            appliedFilters={filters.lead ?? null}
            handleUpdate={(val) => handleFiltersUpdate("lead", val)}
            memberIds={workspaceMemberIds ?? undefined}
            searchQuery={filtersSearchQuery}
          />
        </div>
        {/* start_date */}
        <div className="py-2">
          <FilterStartDate
            appliedFilters={filters.start_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* target_date */}
        <div className="py-2">
          <FilterTargetDate
            appliedFilters={filters.target_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
