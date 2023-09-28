import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  FilterAssignees,
  FilterCreatedBy,
  FilterLabels,
  FilterPriority,
  FilterState,
  FilterStateGroup,
} from "components/issue-layouts";
// icons
import { Search, X } from "lucide-react";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IIssueFilterOptions } from "types";
// constants
import { ISSUE_PRIORITIES, ISSUE_STATE_GROUPS } from "constants/issue";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const FilterSelection: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  const { issueFilter: issueFilterStore, project: projectStore } = useMobxStore();

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
            value={issueFilterStore.filtersSearchQuery}
            onChange={(e) => issueFilterStore.updateFiltersSearchQuery(e.target.value)}
            autoFocus
          />
          {issueFilterStore.filtersSearchQuery !== "" && (
            <button
              type="button"
              className="grid place-items-center"
              onClick={() => issueFilterStore.updateFiltersSearchQuery("")}
            >
              <X className="text-custom-text-300" size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
      <div className="w-full h-full divide-y divide-custom-border-20 px-2.5 overflow-y-auto">
        {/* priority */}
        <div className="py-2">
          <FilterPriority
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            itemsToRender={filtersToRender.priority?.currentLength ?? 0}
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
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            itemsToRender={filtersToRender.state_group?.currentLength ?? 0}
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
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            itemsToRender={filtersToRender.state?.currentLength ?? 0}
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
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            itemsToRender={filtersToRender.assignees?.currentLength ?? 0}
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
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            itemsToRender={filtersToRender.created_by?.currentLength ?? 0}
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
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            itemsToRender={filtersToRender.labels?.currentLength ?? 0}
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
