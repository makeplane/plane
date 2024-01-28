import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issues";
// icons
import { StateGroupIcon } from "@plane/ui";
import { STATE_GROUPS } from "constants/state";
// constants

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterStateGroup: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = Object.values(STATE_GROUPS).filter((s) => s.key.includes(searchQuery.toLowerCase()));

  const handleViewToggle = () => {
    if (!filteredOptions) return;

    if (itemsToRender === filteredOptions.length) setItemsToRender(5);
    else setItemsToRender(filteredOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`State group${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.slice(0, itemsToRender).map((stateGroup) => (
                <FilterOption
                  key={stateGroup.key}
                  isChecked={appliedFilters?.includes(stateGroup.key) ? true : false}
                  onClick={() => handleUpdate(stateGroup.key)}
                  icon={<StateGroupIcon stateGroup={stateGroup.key} />}
                  title={stateGroup.label}
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
          )}
        </div>
      )}
    </>
  );
});
