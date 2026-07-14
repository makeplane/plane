"use client";

import { useCallback, useMemo, useState } from "react";
import type { MatrixFilterState, MatrixSourceTag, SportMatrixConfig } from "../types/matrix.types";
import {
  buildMatrixFilterOptions,
  clearMatrixFilters,
  filterMatrixSourceTags,
  hasActiveMatrixFilters,
} from "../utils/matrix-filters";

type UseMatrixFiltersArgs = {
  config: SportMatrixConfig | null;
  sourceTags: readonly MatrixSourceTag[];
};

const EMPTY_FILTER_OPTIONS = {
  teams: [],
  players: [],
  categories: [],
  periods: [],
};

export const useMatrixFilters = ({ config, sourceTags }: UseMatrixFiltersArgs) => {
  const [filters, setFilters] = useState<MatrixFilterState>(() => clearMatrixFilters());

  const filterOptions = useMemo(
    () => (config ? buildMatrixFilterOptions(sourceTags, config) : EMPTY_FILTER_OPTIONS),
    [config, sourceTags]
  );
  const filteredSourceTags = useMemo(
    () => (config ? filterMatrixSourceTags(sourceTags, filters, config) : []),
    [config, filters, sourceTags]
  );
  const hasActiveFilters = useMemo(() => hasActiveMatrixFilters(filters), [filters]);
  const clearFilters = useCallback(() => setFilters(clearMatrixFilters()), []);

  return {
    clearFilters,
    filteredSourceTags,
    filterOptions,
    filters,
    hasActiveFilters,
    setFilters,
  };
};
