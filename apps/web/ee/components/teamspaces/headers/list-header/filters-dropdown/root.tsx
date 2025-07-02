"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search, X } from "lucide-react";
// components
import { FiltersDropdown } from "@/components/issues";

type TTeamListFiltersDropdown = {
  menuButton?: React.ReactNode;
};

export const TeamListFiltersDropdown: FC<TTeamListFiltersDropdown> = observer((props) => {
  const { menuButton } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  // derived values
  const isFiltersApplied = false; // TODO: Add filters

  return (
    <FiltersDropdown
      icon={<ListFilter className="h-3 w-3" />}
      title="Filters"
      placement="bottom-end"
      isFiltersApplied={isFiltersApplied}
      menuButton={menuButton}
    >
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
              autoFocus
            />
            {filtersSearchQuery !== "" && (
              <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
                <X className="text-custom-text-300" size={12} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5 vertical-scrollbar scrollbar-sm">
          {/* TODO: Add filters */}
        </div>
      </div>
    </FiltersDropdown>
  );
});
