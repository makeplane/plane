import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// ui
import { Loader } from "components/ui";
// icons
import { StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  projectId: string;
  searchQuery: string;
};

export const FilterState: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, itemsToRender, projectId, searchQuery } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { project: projectStore } = store;

  const statesByGroups = projectStore.states?.[projectId?.toString() ?? ""];
  const statesList = getStatesList(statesByGroups);

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
});
