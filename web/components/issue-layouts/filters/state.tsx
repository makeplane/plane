import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// ui
import { Loader } from "components/ui";
// icons
import { StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";

type Props = { workspaceSlug: string; projectId: string; itemsToRender: number };

export const FilterState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, itemsToRender } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

  const statesByGroups = projectStore.states?.[projectId?.toString() ?? ""];
  const statesList = getStatesList(statesByGroups);

  const handleUpdateState = (value: string) => {
    const newValues = issueFilterStore.userFilters?.state ?? [];

    if (issueFilterStore.userFilters?.state?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    else newValues.push(value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        state: newValues,
      },
    });
  };

  const appliedFiltersCount = issueFilterStore.userFilters?.state?.length ?? 0;

  const filteredOptions = statesList?.filter((s) =>
    s.name.toLowerCase().includes(issueFilterStore.filtersSearchQuery.toLowerCase())
  );

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
                    isChecked={issueFilterStore?.userFilters?.state?.includes(state?.id) ? true : false}
                    onClick={() => handleUpdateState(state?.id)}
                    icon={<StateGroupIcon stateGroup={state?.group} color={state?.color} />}
                    title={state?.name}
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
