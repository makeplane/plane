"use client";

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// types
import { TPageFilterProps } from "@plane/types";
// components
import { calculateTotalFilters } from "@plane/utils";
import { PageAppliedFiltersList } from "@/components/pages/list/applied-filters/index";
// helpers
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const PageTypeFiltersHeader = observer(() => {
  // params
  const pathname = usePathname();
  // store hooks
  const { filters, updateFilters, clearAllFilters } = usePageStore(EPageStoreType.WORKSPACE);
  // derived values
  const isFiltersApplied = calculateTotalFilters(filters?.filters ?? {}) !== 0;
  // handle remove filter
  const handleRemoveFilter = useCallback(
    (key: keyof TPageFilterProps, value: string | null) => {
      let newValues = filters.filters?.[key];

      if (key === "favorites") newValues = !!value;
      if (Array.isArray(newValues)) {
        if (!value) newValues = [];
        else newValues = newValues.filter((val) => val !== value);
      }

      updateFilters("filters", { [key]: newValues });
    },
    [filters.filters, updateFilters]
  );

  useEffect(() => {
    clearAllFilters();
    updateFilters("searchQuery", "");
  }, [clearAllFilters, pathname, updateFilters]);

  if (!isFiltersApplied) return null;

  return (
    <div className="border-b border-custom-border-200 px-5 py-3">
      <PageAppliedFiltersList
        appliedFilters={filters.filters ?? {}}
        handleClearAllFilters={clearAllFilters}
        handleRemoveFilter={handleRemoveFilter}
        alwaysAllowEditing
      />
    </div>
  );
});
