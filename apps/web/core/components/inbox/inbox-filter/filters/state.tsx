import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/propel/icons";
import type { IState } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
// hooks
import { useProjectInbox } from "@/hooks/store/use-project-inbox";

type Props = {
  states: IState[] | undefined;
  searchQuery: string;
};

export const FilterState = observer(function FilterState(props: Props) {
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
                    icon={
                      <StateGroupIcon
                        color={state.color}
                        stateGroup={state.group}
                        size={EIconSize.SM}
                        percentage={state?.order}
                      />
                    }
                    title={state.name}
                  />
                ))}
                {filteredOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === filteredOptions.length ? "View less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-11 italic text-placeholder">No matches found</p>
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
