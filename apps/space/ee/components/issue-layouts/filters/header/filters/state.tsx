/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { StateGroupIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
// hooks
import { useStates } from "@/hooks/store/use-state";
// local imports
import { FilterHeader, FilterOption } from "../helpers";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  allowedValues: string[] | undefined;
};

export const FilterState = observer(function FilterState(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery, allowedValues } = props;
  //store
  const { sortedStates: storeStates } = useStates();

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const states =
    allowedValues && allowedValues.length > 0
      ? storeStates?.filter((state) => allowedValues.includes(state.id))
      : storeStates;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (states ?? []).filter((s) => s?.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return sortBy(filteredOptions, [(s) => !(appliedFilters ?? []).includes(s?.id ?? "")]);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
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
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? "View less" : "View all"}
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
