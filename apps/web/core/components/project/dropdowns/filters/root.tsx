import { useState } from "react";
import { observer } from "mobx-react";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
// plane imports
import type { TProjectDisplayFilters, TProjectFilters } from "@plane/types";
// components
import { FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { FilterAccess } from "./access";
import { FilterCreatedDate } from "./created-at";
import { FilterLead } from "./lead";
import { FilterMembers } from "./members";

type Props = {
  displayFilters: TProjectDisplayFilters;
  filters: TProjectFilters;
  handleFiltersUpdate: (key: keyof TProjectFilters, value: string | string[]) => void;
  handleDisplayFiltersUpdate: (updatedDisplayProperties: Partial<TProjectDisplayFilters>) => void;
  memberIds?: string[] | undefined;
};

export const ProjectFiltersSelection = observer(function ProjectFiltersSelection(props: Props) {
  const { displayFilters, filters, handleFiltersUpdate, handleDisplayFiltersUpdate, memberIds } = props;
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");
  // store
  const { isMobile } = usePlatformOS();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="bg-surface-1 p-2.5 pb-0">
        <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-1.5 py-1 text-11">
          <SearchIcon className="text-placeholder" width={12} height={12} strokeWidth={2} />
          <input
            type="text"
            className="w-full bg-surface-2 outline-none placeholder:text-placeholder"
            placeholder="Search"
            value={filtersSearchQuery}
            onChange={(e) => setFiltersSearchQuery(e.target.value)}
            autoFocus={!isMobile}
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
            isChecked={!!displayFilters.my_projects}
            onClick={() =>
              handleDisplayFiltersUpdate({
                my_projects: !displayFilters.my_projects,
              })
            }
            title="My projects"
          />
        </div>

        {/* access */}
        <div className="py-2">
          <FilterAccess
            appliedFilters={filters.access ?? null}
            handleUpdate={(val) => handleFiltersUpdate("access", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>

        {/* lead */}
        <div className="py-2">
          <FilterLead
            appliedFilters={filters.lead ?? null}
            handleUpdate={(val) => handleFiltersUpdate("lead", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* members */}
        <div className="py-2">
          <FilterMembers
            appliedFilters={filters.members ?? null}
            handleUpdate={(val) => handleFiltersUpdate("members", val)}
            searchQuery={filtersSearchQuery}
            memberIds={memberIds}
          />
        </div>

        {/* created date */}
        <div className="py-2">
          <FilterCreatedDate
            appliedFilters={filters.created_at ?? null}
            handleUpdate={(val) => handleFiltersUpdate("created_at", val)}
            searchQuery={filtersSearchQuery}
          />
        </div>
      </div>
    </div>
  );
});
