import React, { useState } from "react";
import { observer } from "mobx-react";
// components
import { FilterHeader, FilterOption } from "components/issues";
// hooks
import { useProject } from "hooks/store";
// ui
import { Loader } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterProjects: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // store
  const { getProjectById, workspaceProjectIds } = useProject();
  // derived values
  const projects = workspaceProjectIds?.map((projectId) => getProjectById(projectId)!) ?? null;
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = projects?.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleViewToggle = () => {
    if (!filteredOptions) return;

    if (itemsToRender === filteredOptions.length) setItemsToRender(5);
    else setItemsToRender(filteredOptions.length);
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
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              <>
                {filteredOptions.slice(0, itemsToRender).map((project) => (
                  <FilterOption
                    key={`project-${project.id}`}
                    isChecked={appliedFilters?.includes(project.id) ? true : false}
                    onClick={() => handleUpdate(project.id)}
                    icon={
                      project.emoji ? (
                        <span className="grid flex-shrink-0 place-items-center text-sm">
                          {renderEmoji(project.emoji)}
                        </span>
                      ) : project.icon_prop ? (
                        <div className="-my-1 grid flex-shrink-0 place-items-center">
                          {renderEmoji(project.icon_prop)}
                        </div>
                      ) : (
                        <span className="mr-1 grid flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                          {project?.name.charAt(0)}
                        </span>
                      )
                    }
                    title={project.name}
                  />
                ))}
                {filteredOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-xs font-medium text-custom-primary-100"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === filteredOptions.length ? "View less" : "View all"}
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
    </>
  );
});
