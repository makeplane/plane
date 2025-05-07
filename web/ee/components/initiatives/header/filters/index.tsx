"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// plane web types
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeDisplayFilters, TInitiativeFilters } from "@/plane-web/types/initiative";
//
import { DisplayFiltersSelection, FiltersDropdown, FilterSelection } from "./header";

export * from "./header";
export * from "./applied-filters";

type Props = {
  workspaceSlug: string;
};

export const HeaderFilters = observer(({ workspaceSlug }: Props) => {
  const {
    initiativeFilters: {
      currentInitiativeFilters,
      currentInitiativeDisplayFilters,
      updateFilters,
      updateDisplayFilters,
    },
  } = useInitiatives();

  const handleFiltersUpdate = useCallback(
    (key: keyof TInitiativeFilters, value: string | string[]) => {
      if (!workspaceSlug) return;
      const newValues = currentInitiativeFilters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (currentInitiativeFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(workspaceSlug, { [key]: newValues });
    },
    [workspaceSlug, currentInitiativeFilters, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<TInitiativeDisplayFilters>) => {
      if (!workspaceSlug) return;
      updateDisplayFilters(workspaceSlug, updatedDisplayFilter);
    },
    [workspaceSlug, currentInitiativeFilters, updateFilters]
  );

  return (
    <>
      <FiltersDropdown
        title="Filters"
        placement="bottom-end"
        isFiltersApplied={!!calculateTotalFilters(currentInitiativeFilters)}
      >
        <FilterSelection filters={currentInitiativeFilters ?? {}} handleFiltersUpdate={handleFiltersUpdate} />
      </FiltersDropdown>
      <FiltersDropdown title="Display" placement="bottom-end">
        <DisplayFiltersSelection
          displayFilters={currentInitiativeDisplayFilters ?? {}}
          handleDisplayFiltersUpdate={handleDisplayFilters}
        />
      </FiltersDropdown>
    </>
  );
});
