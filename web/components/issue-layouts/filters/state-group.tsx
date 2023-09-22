import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// icons
import { StateGroupIcon } from "components/icons";
import { ISSUE_STATE_GROUPS } from "constants/issue";

type Props = { onClick: (stateId: string) => void };

export const FilterStateGroup: React.FC<Props> = observer((props) => {
  const { onClick } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore } = store;

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
              onClick={() => onClick(stateGroup.key)}
              icon={<StateGroupIcon stateGroup={stateGroup.key} />}
              title={stateGroup.title}
            />
          ))}
        </div>
      )}
    </div>
  );
});
