import React, { useState } from "react";

// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

const LabelIcons = ({ color }: { color: string }) => (
  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
);

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const FilterLabels: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { issueFilter: issueFilterStore, project: projectStore } = store;

  const handleUpdateLabels = (value: string) => {
    const newValues = issueFilterStore.userFilters?.labels ?? [];

    if (issueFilterStore.userFilters?.labels?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    else newValues.push(value);

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      filters: {
        labels: newValues,
      },
    });
  };

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
              onClick={() => handleUpdateLabels(label?.id)}
              icon={<LabelIcons color={label.color} />}
              title={label.name}
            />
          ))}
        </div>
      )}
    </div>
  );
});
