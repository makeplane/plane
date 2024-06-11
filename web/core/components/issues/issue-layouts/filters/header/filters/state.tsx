"use client";

import React, { useMemo, useState } from "react";
import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
import { IState } from "@plane/types";
// components
import { Loader, StateGroupIcon } from "@plane/ui";
import { FilterHeader, FilterOption } from "@/components/issues";
// ui
// types

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  states: IState[] | undefined;
};

export const FilterState: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery, states } = props;

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (states ?? []).filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return sortBy(filteredOptions, [(s) => !(appliedFilters ?? []).includes(s.id)]);
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
                {sortedOptions.slice(0, itemsToRender).map((state) => (
                  <FilterOption
                    key={state.id}
                    isChecked={appliedFilters?.includes(state.id) ? true : false}
                    onClick={() => handleUpdate(state.id)}
                    icon={<StateGroupIcon stateGroup={state.group} color={state.color} />}
                    title={state.name}
                  />
                ))}
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
