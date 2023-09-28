import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  FilterAssignees,
  FilterCreatedBy,
  FilterLabels,
  FilterPriority,
  FilterState,
  FilterStateGroup,
} from "components/issues";
// icons
import { Search, X } from "lucide-react";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IIssueFilterOptions } from "types";
// constants
import { ILayoutDisplayFiltersOptions, ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";

type Props = {
  filters: IIssueFilterOptions;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string) => void;
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions;
  projectId: string;
};

export const FilterSelection: React.FC<Props> = observer((props) => {
  const { filters, handleFiltersUpdate, layoutDisplayFiltersOptions, projectId } = props;

  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const { project: projectStore } = useMobxStore();

  const statesList = getStatesList(projectStore.states?.[projectId?.toString() ?? ""]);

  const [filtersToRender, setFiltersToRender] = useState<{
    [key in keyof IIssueFilterOptions]: {
      currentLength: number;
      totalLength: number;
    };
  }>({
    assignees: {
      currentLength: 5,
      totalLength: projectStore.members?.[projectId]?.length ?? 0,
    },
    created_by: {
      currentLength: 5,
      totalLength: projectStore.members?.[projectId]?.length ?? 0,
    },
    labels: {
      currentLength: 5,
      totalLength: projectStore.labels?.[projectId]?.length ?? 0,
    },
    priority: {
      currentLength: 5,
      totalLength: ISSUE_PRIORITIES.length,
    },
    state_group: {
      currentLength: 5,
      totalLength: ISSUE_STATE_GROUPS.length,
    },
    state: {
      currentLength: 5,
      totalLength: statesList?.length ?? 0,
    },
  });

  const handleViewMore = (filterName: keyof IIssueFilterOptions) => {
    const filterDetails = filtersToRender[filterName];

    if (!filterDetails) return;

    if (filterDetails.currentLength <= filterDetails.totalLength)
      setFiltersToRender((prev) => ({
        ...prev,
        [filterName]: {
          ...prev[filterName],
          currentLength: filterDetails.currentLength + 5,
        },
      }));
  };

  const isViewMoreVisible = (filterName: keyof IIssueFilterOptions): boolean => {
    const filterDetails = filtersToRender[filterName];

    if (!filterDetails) return false;

    return filterDetails.currentLength < filterDetails.totalLength;
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="p-2.5 bg-custom-background-100">
        <div className="bg-custom-background-90 border-[0.5px] border-custom-border-200 text-xs rounded flex items-center gap-1.5 px-1.5 py-1">
          <Search className="text-custom-text-400" size={12} strokeWidth={2} />
          <input
            type="text"
            className="bg-custom-background-90 placeholder:text-custom-text-400 w-full outline-none"
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
      <div className="w-full h-full divide-y divide-custom-border-20 px-2.5 overflow-y-auto">
        {/* priority */}
        <div className="py-2">
          <FilterPriority
            appliedFilters={filters.priority ?? null}
            handleUpdate={(val) => handleFiltersUpdate("priority", val)}
            itemsToRender={filtersToRender.priority?.currentLength ?? 0}
            searchQuery={filtersSearchQuery}
          />
          {isViewMoreVisible("priority") && (
            <button
              className="text-custom-primary-100 text-xs font-medium ml-7"
              onClick={() => handleViewMore("priority")}
            >
              View more
            </button>
          )}
        </div>

        {/* state group */}
        <div className="py-2">
          <FilterStateGroup
            appliedFilters={filters.state_group ?? null}
            handleUpdate={(val) => handleFiltersUpdate("state_group", val)}
            itemsToRender={filtersToRender.state_group?.currentLength ?? 0}
            searchQuery={filtersSearchQuery}
          />
          {isViewMoreVisible("state_group") && (
            <button
              className="text-custom-primary-100 text-xs font-medium ml-7"
              onClick={() => handleViewMore("state_group")}
            >
              View more
            </button>
          )}
        </div>

        {/* state */}
        <div className="py-2">
          <FilterState
            appliedFilters={filters.state ?? null}
            handleUpdate={(val) => handleFiltersUpdate("state", val)}
            itemsToRender={filtersToRender.state?.currentLength ?? 0}
            searchQuery={filtersSearchQuery}
            projectId={projectId}
          />
          {isViewMoreVisible("state") && (
            <button
              className="text-custom-primary-100 text-xs font-medium ml-7"
              onClick={() => handleViewMore("state")}
            >
              View more
            </button>
          )}
        </div>

        {/* assignees */}
        <div className="py-2">
          <FilterAssignees
            appliedFilters={filters.assignees ?? null}
            handleUpdate={(val) => handleFiltersUpdate("assignees", val)}
            itemsToRender={filtersToRender.assignees?.currentLength ?? 0}
            projectId={projectId}
            searchQuery={filtersSearchQuery}
          />
          {isViewMoreVisible("assignees") && (
            <button
              className="text-custom-primary-100 text-xs font-medium ml-7"
              onClick={() => handleViewMore("assignees")}
            >
              View more
            </button>
          )}
        </div>

        {/* created_by */}
        <div className="py-2">
          <FilterCreatedBy
            appliedFilters={filters.created_by ?? null}
            handleUpdate={(val) => handleFiltersUpdate("created_by", val)}
            itemsToRender={filtersToRender.created_by?.currentLength ?? 0}
            projectId={projectId}
            searchQuery={filtersSearchQuery}
          />
          {isViewMoreVisible("created_by") && (
            <button
              className="text-custom-primary-100 text-xs font-medium ml-7"
              onClick={() => handleViewMore("created_by")}
            >
              View more
            </button>
          )}
        </div>

        {/* labels */}
        <div className="py-2">
          <FilterLabels
            appliedFilters={filters.labels ?? null}
            handleUpdate={(val) => handleFiltersUpdate("labels", val)}
            itemsToRender={filtersToRender.labels?.currentLength ?? 0}
            projectId={projectId}
            searchQuery={filtersSearchQuery}
          />
          {isViewMoreVisible("labels") && (
            <button
              className="text-custom-primary-100 text-xs font-medium ml-7"
              onClick={() => handleViewMore("labels")}
            >
              View more
            </button>
          )}
        </div>

        {/* start_date */}
        {/* <div>
          <FilterStartDate />
        </div> */}

        {/* due_date */}
        {/* <div>
          <FilterTargetDate />
        </div> */}
      </div>
    </div>
  );
});
