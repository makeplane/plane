import React from "react";

// components
import {
  FilterAssignees,
  FilterCreatedBy,
  FilterLabels,
  FilterPriority,
  FilterState,
  FilterStateGroup,
} from "components/issue-layouts";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const FilterSelection: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId } = props;

  return (
    <div className="w-full h-full overflow-hidden select-none relative flex flex-col divide-y divide-custom-border-200 px-0.5">
      {/* <div className="flex-shrink-0 p-2 text-sm">Search container</div> */}
      <div className="w-full h-full overflow-hidden overflow-y-auto relative pb-2 divide-y divide-custom-border-200">
        {/* priority */}
        <div className="pb-1 px-2">
          <FilterPriority workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>

        {/* state group */}
        <div className="py-1 px-2">
          <FilterStateGroup workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>

        {/* state */}
        <div className="py-1 px-2">
          <FilterState workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>

        {/* assignees */}
        <div className="py-1 px-2">
          <FilterAssignees workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>

        {/* created_by */}
        <div className="py-1 px-2">
          <FilterCreatedBy workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>

        {/* labels */}
        <div className="py-1 px-2">
          <FilterLabels workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>

        {/* start_date */}
        {/* {handleFilterSectionVisibility("start_date") && (
          <div className="py-1 px-2">
            <FilterStartDate />
          </div>
        )} */}

        {/* due_date */}
        {/* {handleFilterSectionVisibility("due_date") && (
          <div className="pt-1 px-2">
            <FilterTargetDate />
          </div>
        )} */}
      </div>
    </div>
  );
};
