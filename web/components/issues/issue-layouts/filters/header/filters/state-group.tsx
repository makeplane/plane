import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issues";
// icons
import { StateGroupIcon } from "@plane/ui";
// constants
import { ISSUE_STATE_GROUPS } from "constants/issue";

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

  const filteredOptions = ISSUE_STATE_GROUPS.filter((s) => s.key.includes(searchQuery.toLowerCase()));

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
                  title={stateGroup.title}
                />
              ))}
              {filteredOptions.length > 5 && (
                <button
                  type="button"
                  className="text-custom-primary-100 text-xs font-medium ml-8"
                  onClick={handleViewToggle}
                >
                  {itemsToRender === filteredOptions.length ? "View less" : "View all"}
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-custom-text-400 italic">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
