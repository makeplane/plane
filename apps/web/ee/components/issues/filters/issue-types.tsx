"use client";

import React, { useMemo, useState } from "react";
import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Loader } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";
// plane web hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterIssueTypes: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // hooks
  const { workspaceSlug, projectId: routerProjectId } = useParams();
  const { issueTypes: workspaceIssueTypes, isWorkItemTypeEnabledForProject, getProjectIssueTypes } = useIssueTypes();
  const { getProjectById } = useProject();
  // derived values
  const projectId = routerProjectId?.toString();
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId);
  const issueTypes = projectId ? getProjectIssueTypes(projectId, false) : workspaceIssueTypes;
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  // Return null if issue type is not enabled for the project
  if (!isWorkItemTypeEnabled) return null;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (Object.values(issueTypes) || []).filter((issueType) =>
      issueType.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return sortBy(filteredOptions, [
      (issueType) => issueType.id && !appliedFilters?.includes(issueType.id),
      (issueType) => issueType.name?.toLowerCase(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  return (
    <div className="py-2">
      <FilterHeader
        title={`Work item Type ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((issueType) => (
                  <FilterOption
                    key={issueType.id}
                    isChecked={issueType.id && appliedFilters?.includes(issueType.id) ? true : false}
                    onClick={() => issueType.id && handleUpdate(issueType.id)}
                    icon={<IssueTypeLogo icon_props={issueType?.logo_props?.icon} isDefault={issueType?.is_default} />}
                    title={
                      projectId
                        ? issueType.name
                        : `${issueType.name}: ${getProjectById(issueType.project_ids?.[0])?.name}`
                    }
                  />
                ))}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-xs font-medium text-custom-primary-100"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs italic text-custom-text-400">No matches found</p>
            )
          ) : (
            <Loader className="space-y-2">
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
            </Loader>
          )}
        </div>
      )}
    </div>
  );
});
