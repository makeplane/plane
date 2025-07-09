"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { IIssueLabel } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// hooks
import { useProjectInbox } from "@/hooks/store";

const LabelIcons = ({ color }: { color: string }) => (
  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
);

type Props = {
  labels: IIssueLabel[] | undefined;
  searchQuery: string;
};

export const FilterLabels: FC<Props> = observer((props) => {
  const { labels, searchQuery } = props;

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();

  const filterValue = inboxFilters?.labels || [];

  const appliedFiltersCount = filterValue?.length ?? 0;

  const filteredOptions = labels?.filter((label) => label.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleViewToggle = () => {
    if (!filteredOptions) return;

    if (itemsToRender === filteredOptions.length) setItemsToRender(5);
    else setItemsToRender(filteredOptions.length);
  };

  const handleFilterValue = (value: string): string[] =>
    filterValue?.includes(value) ? filterValue.filter((v) => v !== value) : [...filterValue, value];

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
                    isChecked={filterValue?.includes(label?.id) ? true : false}
                    onClick={() => handleInboxIssueFilters("labels", handleFilterValue(label.id))}
                    icon={<LabelIcons color={label.color} />}
                    title={label.name}
                  />
                ))}
                {filteredOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-xs font-medium text-custom-primary-100"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === filteredOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-xs italic text-custom-text-400">No matches found</p>
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
