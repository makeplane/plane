"use client";

import { useState } from "react";
import { Columns3, ListPlus, X } from "lucide-react";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";
import type { MatrixColumn, MatrixFilterOptions, MatrixFilterState } from "../types/matrix.types";
import { AxisViewToggle } from "./axis-view-toggle";
import { MatrixColumnsPanel } from "./matrix-columns-panel";
import { MatrixFilters } from "./matrix-filters";

type MatrixToolbarProps = {
  actionColumns: MatrixColumn[];
  canCreatePlaylist: boolean;
  defaultVisibleActionColumnIds: readonly string[];
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
  onVisibleActionColumnIdsChange: (visibleColumnIds: string[]) => void;
  selectedCellCount: number;
  selectedPlayableRowCount: number;
  showFilters: boolean;
  visibleActionColumnIds: readonly string[];
};

export const MatrixToolbar = ({
  actionColumns,
  canCreatePlaylist,
  defaultVisibleActionColumnIds,
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
  onVisibleActionColumnIdsChange,
  selectedCellCount,
  selectedPlayableRowCount,
  showFilters,
  visibleActionColumnIds,
}: MatrixToolbarProps) => {
  const [isColumnsPanelOpen, setIsColumnsPanelOpen] = useState(false);
  const visibleActionColumnIdSet = new Set(visibleActionColumnIds);
  const visibleActionColumnCount = actionColumns.filter((column) => visibleActionColumnIdSet.has(column.id)).length;

  return (
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
          <button
            type="button"
            onClick={() => setIsColumnsPanelOpen(true)}
            disabled={disabled || actionColumns.length === 0}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors",
              isColumnsPanelOpen
                ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                : "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100",
              (disabled || actionColumns.length === 0) && "cursor-not-allowed opacity-40"
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>Columns</span>
            <span className="text-custom-text-400">
              {visibleActionColumnCount}/{actionColumns.length}
            </span>
          </button>
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
      {isColumnsPanelOpen ? (
        <MatrixColumnsPanel
          columns={actionColumns}
          defaultVisibleColumnIds={defaultVisibleActionColumnIds}
          onChange={onVisibleActionColumnIdsChange}
          onClose={() => setIsColumnsPanelOpen(false)}
          visibleColumnIds={visibleActionColumnIds}
        />
      ) : null}
    </div>
  );
};
