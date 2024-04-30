import { useState } from "react";
import { observer } from "mobx-react";
import { Search, X } from "lucide-react";
import { IIssueFilterOptions, IIssueLabel, IState } from "@plane/types";
// hooks
import {
  FilterAssignees,
  FilterMentions,
  FilterCreatedBy,
  FilterLabels,
  FilterPriority,
  FilterProjects,
  FilterStartDate,
  FilterState,
  FilterStateGroup,
  FilterTargetDate,
  FilterCycle,
  FilterModule,
} from "@/components/issues";
import { ILayoutDisplayFiltersOptions } from "@/constants/issue";
import { useAppRouter } from "@/hooks/store";
// components
// types
// constants

type Props = {
  filters: IIssueFilterOptions;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions | undefined;
  labels?: IIssueLabel[] | undefined;
  memberIds?: string[] | undefined;
  states?: IState[] | undefined;
  cycleViewDisabled?: boolean;
  moduleViewDisabled?: boolean;
};

export const FilterSelection: React.FC<Props> = observer((props) => {
  const {
    filters,
    handleFiltersUpdate,
    layoutDisplayFiltersOptions,
    labels,
    memberIds,
    states,
    cycleViewDisabled = false,
    moduleViewDisabled = false,
  } = props;
  // hooks
  const { moduleId, cycleId } = useAppRouter();
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) => layoutDisplayFiltersOptions?.filters.includes(filter);

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
            autoFocus
          />
          {filtersSearchQuery !== "" && (
            <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
              <X className="text-custom-text-300" size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5">
        {/* priority */}
        {isFilterEnabled("priority") && (
          <div className="py-2">
            <FilterPriority
              appliedFilters={filters.priority ?? null}
              handleUpdate={(val) => handleFiltersUpdate("priority", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* state group */}
        {isFilterEnabled("state_group") && (
          <div className="py-2">
            <FilterStateGroup
              appliedFilters={filters.state_group ?? null}
              handleUpdate={(val) => handleFiltersUpdate("state_group", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* state */}
        {isFilterEnabled("state") && (
          <div className="py-2">
            <FilterState
              appliedFilters={filters.state ?? null}
              handleUpdate={(val) => handleFiltersUpdate("state", val)}
              searchQuery={filtersSearchQuery}
              states={states}
            />
          </div>
        )}

        {/* assignees */}
        {isFilterEnabled("assignees") && (
          <div className="py-2">
            <FilterAssignees
              appliedFilters={filters.assignees ?? null}
              handleUpdate={(val) => handleFiltersUpdate("assignees", val)}
              memberIds={memberIds}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* cycle */}
        {isFilterEnabled("cycle") && !cycleId && !cycleViewDisabled && (
          <div className="py-2">
            <FilterCycle
              appliedFilters={filters.cycle ?? null}
              handleUpdate={(val) => handleFiltersUpdate("cycle", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* module */}
        {isFilterEnabled("module") && !moduleId && !moduleViewDisabled && (
          <div className="py-2">
            <FilterModule
              appliedFilters={filters.module ?? null}
              handleUpdate={(val) => handleFiltersUpdate("module", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* assignees */}
        {isFilterEnabled("mentions") && (
          <div className="py-2">
            <FilterMentions
              appliedFilters={filters.mentions ?? null}
              handleUpdate={(val) => handleFiltersUpdate("mentions", val)}
              memberIds={memberIds}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* created_by */}
        {isFilterEnabled("created_by") && (
          <div className="py-2">
            <FilterCreatedBy
              appliedFilters={filters.created_by ?? null}
              handleUpdate={(val) => handleFiltersUpdate("created_by", val)}
              memberIds={memberIds}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* labels */}
        {isFilterEnabled("labels") && (
          <div className="py-2">
            <FilterLabels
              appliedFilters={filters.labels ?? null}
              handleUpdate={(val) => handleFiltersUpdate("labels", val)}
              labels={labels}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* project */}
        {isFilterEnabled("project") && (
          <div className="py-2">
            <FilterProjects
              appliedFilters={filters.project ?? null}
              handleUpdate={(val) => handleFiltersUpdate("project", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* start_date */}
        {isFilterEnabled("start_date") && (
          <div className="py-2">
            <FilterStartDate
              appliedFilters={filters.start_date ?? null}
              handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}

        {/* target_date */}
        {isFilterEnabled("target_date") && (
          <div className="py-2">
            <FilterTargetDate
              appliedFilters={filters.target_date ?? null}
              handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
              searchQuery={filtersSearchQuery}
            />
          </div>
        )}
      </div>
    </div>
  );
});
