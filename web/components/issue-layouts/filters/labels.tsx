import React, { useState } from "react";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issue-layouts";
// ui
import { Loader } from "components/ui";

const LabelIcons = ({ color }: { color: string }) => (
  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
);

type Props = { workspaceSlug: string; projectId: string; itemsToRender: number };

export const FilterLabels: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, itemsToRender } = props;

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

  const appliedFiltersCount = issueFilterStore.userFilters?.labels?.length ?? 0;

  const filteredOptions = projectStore.labels?.[projectId?.toString() ?? ""]?.filter((label) =>
    label.name.toLowerCase().includes(issueFilterStore.filtersSearchQuery.toLowerCase())
  );

  return (
    <>
      <FilterHeader
        title={`Label${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              filteredOptions
                .slice(0, itemsToRender)
                .map((label) => (
                  <FilterOption
                    key={label?.id}
                    isChecked={issueFilterStore?.userFilters?.labels?.includes(label?.id) ? true : false}
                    onClick={() => handleUpdateLabels(label?.id)}
                    icon={<LabelIcons color={label.color} />}
                    title={label.name}
                  />
                ))
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
