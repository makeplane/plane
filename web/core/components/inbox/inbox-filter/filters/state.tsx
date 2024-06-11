"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { IState } from "@plane/types";
import { Loader, StateGroupIcon } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
// hooks
import { useProjectInbox } from "@/hooks/store";

type Props = {
  states: IState[] | undefined;
  searchQuery: string;
};

export const FilterState: FC<Props> = observer((props) => {
  const { states, searchQuery } = props;

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();

  const filterValue = inboxFilters?.state || [];

  const appliedFiltersCount = filterValue?.length ?? 0;

  const filteredOptions = states?.filter((state) => state.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
        title={`State${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions ? (
            filteredOptions.length > 0 ? (
              <>
                {filteredOptions.slice(0, itemsToRender).map((state) => (
                  <FilterOption
                    key={state?.id}
                    isChecked={filterValue?.includes(state?.id) ? true : false}
                    onClick={() => handleInboxIssueFilters("state", handleFilterValue(state.id))}
                    icon={<StateGroupIcon color={state.color} stateGroup={state.group} height="12px" width="12px" />}
                    title={state.name}
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
