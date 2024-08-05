"use client";

import React, { useMemo, useState } from "react";
import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
// components
import { Loader, StateGroupIcon } from "@plane/ui";
// hooks
import { useStates } from "@/hooks/store";
//
import { FilterHeader, FilterOption } from "../helpers";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  allowedValues: string[] | undefined;
};

export const FilterState: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery, allowedValues } = props;
  //store
  const { getStateById, states: storeStates } = useStates();

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const states =
    allowedValues && allowedValues.length > 0
      ? allowedValues.map((stateId: string) => getStateById(stateId))
      : storeStates;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (states ?? []).filter((s) => s?.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return sortBy(filteredOptions, [(s) => !(appliedFilters ?? []).includes(s?.id ?? "")]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={`State${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((state) => {
                  if (!state) return <></>;

                  return (
                    <FilterOption
                      key={state.id}
                      isChecked={appliedFilters?.includes(state.id) ? true : false}
                      onClick={() => handleUpdate(state.id)}
                      icon={<StateGroupIcon stateGroup={state.group} color={state.color} />}
                      title={state.name}
                    />
                  );
                })}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-xs font-medium text-custom-primary-100"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
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
