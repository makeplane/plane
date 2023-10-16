import React, { useState } from "react";

// components
import { FilterHeader, FilterOption } from "components/issues";
// ui
import { Loader } from "@plane/ui";
// icons
import { StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";
// types
import { IStateResponse } from "types";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  searchQuery: string;
  states: IStateResponse | undefined;
  viewButtons: React.ReactNode;
};

export const FilterState: React.FC<Props> = (props) => {
  const { appliedFilters, handleUpdate, itemsToRender, searchQuery, states, viewButtons } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const statesList = getStatesList(states);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = statesList?.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`State${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              <>
                {filteredOptions.slice(0, itemsToRender).map((state) => (
                  <FilterOption
                    key={state.id}
                    isChecked={appliedFilters?.includes(state.id) ? true : false}
                    onClick={() => handleUpdate(state.id)}
                    icon={<StateGroupIcon stateGroup={state.group} color={state.color} />}
                    title={state.name}
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
