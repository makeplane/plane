import React, { useState } from "react";

// components
import { FilterHeader, FilterOption } from "components/issues";
// ui
import { Loader } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// types
import { IProject } from "types";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  projects: IProject[] | undefined;
  searchQuery: string;
  viewButtons: React.ReactNode;
};

export const FilterProjects: React.FC<Props> = (props) => {
  const { appliedFilters, handleUpdate, itemsToRender, projects, searchQuery, viewButtons } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = projects?.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
                        <div className="grid place-items-center flex-shrink-0 -my-1">
                          {renderEmoji(project.icon_prop)}
                        </div>
                      ) : (
                        <span className="grid mr-1 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                          {project?.name.charAt(0)}
                        </span>
                      )
                    }
                    title={project.name}
                  />
                ))}
                {viewButtons}
              </>
            ) : (
              <p className="text-xs text-custom-text-400 italic">No matches found</p>
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
};
