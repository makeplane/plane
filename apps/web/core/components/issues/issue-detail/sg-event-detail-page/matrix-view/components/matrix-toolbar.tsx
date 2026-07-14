"use client";

import { ListPlus, X } from "lucide-react";
import { Button } from "@plane/propel/button";
import type { MatrixFilterOptions, MatrixFilterState } from "../types/matrix.types";
import { AxisViewToggle } from "./axis-view-toggle";
import { MatrixFilters } from "./matrix-filters";

type MatrixToolbarProps = {
  canCreatePlaylist: boolean;
  disabled?: boolean;
  filters: MatrixFilterState;
  filterOptions: MatrixFilterOptions;
  hasActiveFilters: boolean;
  isCreatingPlaylist?: boolean;
  isSwitched: boolean;
  onAxisChange: (isSwitched: boolean) => void;
  onClearFilters: () => void;
  onClearSelection: () => void;
  onCreatePlaylist: () => void;
  onFiltersChange: (filters: MatrixFilterState) => void;
  selectedCellCount: number;
  selectedPlayableRowCount: number;
  showFilters: boolean;
};

export const MatrixToolbar = ({
  canCreatePlaylist,
  disabled = false,
  filters,
  filterOptions,
  hasActiveFilters,
  isCreatingPlaylist = false,
  isSwitched,
  onAxisChange,
  onClearFilters,
  onClearSelection,
  onCreatePlaylist,
  onFiltersChange,
  selectedCellCount,
  selectedPlayableRowCount,
  showFilters,
}: MatrixToolbarProps) => (
  <div className="flex flex-col gap-2 border-b border-custom-border-200 bg-custom-background-90 px-3 py-2">
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
      <AxisViewToggle disabled={disabled} isSwitched={isSwitched} onChange={onAxisChange} />
      <div className="flex items-center gap-1.5">
        {selectedCellCount > 0 ? (
          <>
            <span aria-live="polite" className="whitespace-nowrap text-xs text-custom-text-300">
              {selectedCellCount} {selectedCellCount === 1 ? "cell" : "cells"} selected
            </span>
            <Button
              aria-label="Clear selected matrix cells"
              disabled={disabled || isCreatingPlaylist}
              onClick={onClearSelection}
              prependIcon={<X />}
              size="sm"
              variant="link-neutral"
            >
              Clear
            </Button>
          </>
        ) : null}
        <Button
          disabled={disabled || !canCreatePlaylist || selectedPlayableRowCount === 0}
          loading={isCreatingPlaylist}
          onClick={onCreatePlaylist}
          prependIcon={<ListPlus />}
          size="sm"
          title={
            selectedCellCount > 0 && selectedPlayableRowCount === 0
              ? "Selected tags do not contain playable timestamps"
              : undefined
          }
          variant="neutral-primary"
        >
          Create Playlist
        </Button>
      </div>
    </div>
    {showFilters ? (
      <MatrixFilters
        disabled={disabled}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onChange={onFiltersChange}
        onClear={onClearFilters}
        options={filterOptions}
      />
    ) : null}
  </div>
);
