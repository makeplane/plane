import React, { useState } from "react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { FilterHeader, FilterOption } from "components/issues";
// ui
import { Loader } from "components/ui";

const LabelIcons = ({ color }: { color: string }) => (
  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
);

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  projectId: string;
  searchQuery: string;
  viewButtons: React.ReactNode;
};

export const FilterLabels: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, itemsToRender, projectId, searchQuery, viewButtons } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const store = useMobxStore();
  const { project: projectStore } = store;

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = projectStore.labels?.[projectId?.toString() ?? ""]?.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              <>
                {filteredOptions.slice(0, itemsToRender).map((label) => (
                  <FilterOption
                    key={label?.id}
                    isChecked={appliedFilters?.includes(label?.id) ? true : false}
                    onClick={() => handleUpdate(label?.id)}
                    icon={<LabelIcons color={label.color} />}
                    title={label.name}
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
});
