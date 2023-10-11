import React, { useState } from "react";

// components
import { FilterHeader, FilterOption } from "components/issues";
// ui
import { Loader } from "@plane/ui";
// types
import { IIssueLabels } from "types";

const LabelIcons = ({ color }: { color: string }) => (
  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
);

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  itemsToRender: number;
  labels: IIssueLabels[] | undefined;
  searchQuery: string;
  viewButtons: React.ReactNode;
};

export const FilterLabels: React.FC<Props> = (props) => {
  const { appliedFilters, handleUpdate, itemsToRender, labels, searchQuery, viewButtons } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = labels?.filter((label) => label.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
};
