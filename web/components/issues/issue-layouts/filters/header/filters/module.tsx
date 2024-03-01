import React, { useState } from "react";
import { observer } from "mobx-react";
import sortBy from "lodash/sortBy";
// components
import { FilterHeader, FilterOption } from "components/issues";
import { useApplication, useModule } from "hooks/store";
// ui
import { Loader, DiceIcon } from "@plane/ui";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterModule: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;

  // hooks
  const {
    router: { projectId },
  } = useApplication();
  const { getModuleById, getProjectModuleIds } = useModule();

  // states
  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const moduleIds = projectId ? getProjectModuleIds(projectId) : undefined;
  const modules = moduleIds?.map((projectId) => getModuleById(projectId)!) ?? null;
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = sortBy(
    modules?.filter((module) => module.name.toLowerCase().includes(searchQuery.toLowerCase())),
    (module) => module.name.toLowerCase()
  );

  const handleViewToggle = () => {
    if (!filteredOptions) return;

    if (itemsToRender === filteredOptions.length) setItemsToRender(5);
    else setItemsToRender(filteredOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`Module ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              <>
                {filteredOptions.slice(0, itemsToRender).map((cycle) => (
                  <FilterOption
                    key={cycle.id}
                    isChecked={appliedFilters?.includes(cycle.id) ? true : false}
                    onClick={() => handleUpdate(cycle.id)}
                    icon={<DiceIcon className="h-3 w-3 flex-shrink-0" />}
                    title={cycle.name}
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
