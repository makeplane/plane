import React from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// icons
import { StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const FilterState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

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

  return (
    <div>
      <FilterHeader
        title={`State (${issueFilterStore.userFilters?.state?.length ?? 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-1 pt-1">
          {statesList?.map((state) => (
            <FilterOption
              key={state.id}
              isChecked={issueFilterStore?.userFilters?.state?.includes(state?.id) ? true : false}
              onClick={() => handleUpdateState(state?.id)}
              icon={<StateGroupIcon stateGroup={state?.group} color={state?.color} />}
              title={state?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
});
