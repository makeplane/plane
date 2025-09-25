"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { TInitiativeDisplayFilters } from "@plane/types";

// plane imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

// local imports
import { DisplayFiltersSelection, FiltersDropdown } from "./header";

export * from "./header";

type Props = {
  workspaceSlug: string;
};

export const HeaderFilters = observer(({ workspaceSlug }: Props) => {
  const {
    initiativeFilters: { currentInitiativeDisplayFilters, updateDisplayFilters },
  } = useInitiatives();

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<TInitiativeDisplayFilters>) => {
      if (!workspaceSlug) return;
      updateDisplayFilters(workspaceSlug, updatedDisplayFilter);
    },
    [workspaceSlug, updateDisplayFilters]
  );

  return (
    <FiltersDropdown title="Display" placement="bottom-end">
      <DisplayFiltersSelection
        displayFilters={currentInitiativeDisplayFilters ?? {}}
        handleDisplayFiltersUpdate={handleDisplayFilters}
      />
    </FiltersDropdown>
  );
});
