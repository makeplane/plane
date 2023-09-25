import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// icons
import { StateGroupIcon } from "components/icons";
// constants
import { ISSUE_STATE_GROUPS } from "constants/issue";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const FilterStateGroup: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

  const handleUpdateStateGroup = (value: string) => {
    const newValues = issueFilterStore.userFilters?.state_group ?? [];

    if (issueFilterStore.userFilters?.state_group?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    else newValues.push(value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        state_group: newValues,
      },
    });
  };

  return (
    <div>
      <FilterHeader
        title={`State Group (${issueFilterStore.userFilters?.state_group?.length ?? 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-1 pt-1">
          {ISSUE_STATE_GROUPS.map((stateGroup) => (
            <FilterOption
              key={stateGroup.key}
              isChecked={issueFilterStore.userFilters?.state_group?.includes(stateGroup.key) ? true : false}
              onClick={() => handleUpdateStateGroup(stateGroup.key)}
              icon={<StateGroupIcon stateGroup={stateGroup.key} />}
              title={stateGroup.title}
            />
          ))}
        </div>
      )}
    </div>
  );
});
