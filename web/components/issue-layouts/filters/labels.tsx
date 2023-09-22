import React, { useState } from "react";

import { useRouter } from "next/router";

// components
import { FilterHeader } from "../helpers/filter-header";
import { FilterOption } from "../helpers/filter-option";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

const LabelIcons = ({ color }: { color: string }) => (
  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
);

type Props = { onClick: (stateId: string) => void };

export const FilterLabels: React.FC<Props> = observer((props) => {
  const { onClick } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const router = useRouter();
  const { projectId } = router.query;

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

  return (
    <div>
      <FilterHeader
        title={`Labels (${issueFilterStore.userFilters?.labels?.length ?? 0})`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div className="space-y-[2px] pt-1">
          {projectStore.labels?.[projectId?.toString() ?? ""]?.map((label) => (
            <FilterOption
              key={label?.id}
              isChecked={issueFilterStore?.userFilters?.labels?.includes(label?.id) ? true : false}
              onClick={() => onClick(label?.id)}
              icon={<LabelIcons color={label.color} />}
              title={label.name}
            />
          ))}
        </div>
      )}
    </div>
  );
});
