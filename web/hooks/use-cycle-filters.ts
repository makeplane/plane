import { useCallback } from "react";
// hooks
import useLocalStorage from "./use-local-storage";
// types
import { TCycleDisplayFilters, TCycleFilters, TCycleStoredFilters } from "@plane/types";

const DEFAULT_CYCLE_FILTERS: TCycleStoredFilters = {
  display_filters: {
    active_tab: "active",
    layout: "list",
    order_by: "end_date",
  },
  filters: {},
};

const useCycleFilters = (projectId: string) => {
  // local storage hook
  const { storedValue: storedFilters, setValue: setFilters } = useLocalStorage<TCycleStoredFilters>(
    `cycle_filters/${projectId}`,
    DEFAULT_CYCLE_FILTERS
  );

  const handleUpdateStoredFilters = useCallback(
    (filters: TCycleStoredFilters) => {
      setFilters({
        ...storedFilters,
        ...filters,
      });
    },
    [setFilters, storedFilters]
  );

  const handleUpdateDisplayFilters = useCallback(
    (displayFilters: TCycleDisplayFilters) => {
      const updatedDisplayFilters = {
        ...storedFilters?.display_filters,
        ...displayFilters,
      };

      handleUpdateStoredFilters({
        display_filters: updatedDisplayFilters,
      });
    },
    [handleUpdateStoredFilters, storedFilters?.display_filters]
  );

  const handleUpdateFilters = useCallback(
    (filters: TCycleFilters) => {
      const updatedFilters = {
        ...storedFilters?.filters,
        ...filters,
      };

      handleUpdateStoredFilters({
        filters: updatedFilters,
      });
    },
    [handleUpdateStoredFilters, storedFilters?.filters]
  );

  const clearFilters = useCallback(() => {
    handleUpdateStoredFilters({
      filters: {},
    });
  }, [handleUpdateStoredFilters]);

  return {
    clearAllFilters: clearFilters,
    displayFilters: storedFilters?.display_filters,
    filters: storedFilters?.filters,
    handleUpdateDisplayFilters,
    handleUpdateFilters,
  };
};

export default useCycleFilters;
