import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// components
import { FilterHeader, FilterOption } from "components/issues";
// icons
import { StateGroupIcon } from "components/icons";
// constants
import { ISSUE_STATE_GROUPS } from "constants/issue";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  searchQuery: string;
  viewButtons: React.ReactNode;
};

export const FilterStateGroup: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, itemsToRender, searchQuery, viewButtons } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = ISSUE_STATE_GROUPS.filter((s) => s.key.includes(searchQuery.toLowerCase()));

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
              {viewButtons}
            </>
          ) : (
            <p className="text-xs text-custom-text-400 italic">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
