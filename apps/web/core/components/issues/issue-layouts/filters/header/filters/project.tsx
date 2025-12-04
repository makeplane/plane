import React, { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
// ui
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Loader } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterProjects = observer(function FilterProjects(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // store
  const { getProjectById, joinedProjectIds } = useProject();
  // derived values
  const projects = joinedProjectIds?.map((projectId) => getProjectById(projectId)!) ?? null;
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (projects || []).filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortBy(filteredOptions, [
      (project) => !(appliedFilters ?? []).includes(project.id),
      (project) => project.name.toLowerCase(),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`Project${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((project) => (
                  <FilterOption
                    key={`project-${project.id}`}
                    isChecked={appliedFilters?.includes(project.id) ? true : false}
                    onClick={() => handleUpdate(project.id)}
                    icon={
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <Logo logo={project.logo_props} size={12} />
                      </span>
                    }
                    title={project.name}
                  />
                ))}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-11 italic text-placeholder">No matches found</p>
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
    </>
  );
});
