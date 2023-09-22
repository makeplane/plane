import React from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// icons
import { StateGroupIcon } from "components/icons";
// helpers
import { getStatesList } from "helpers/state.helper";

type Props = { onClick: (stateId: string) => void };

export const FilterState: React.FC<Props> = observer((props) => {
  const { onClick } = props;

  const router = useRouter();
  const { projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

  const [previewEnabled, setPreviewEnabled] = React.useState(true);

  const statesByGroups = projectStore.states?.[projectId?.toString() ?? ""];
  const statesList = getStatesList(statesByGroups);

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
              onClick={() => onClick(state?.id)}
              icon={<StateGroupIcon stateGroup={state?.group} color={state?.color} />}
              title={state?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
});
