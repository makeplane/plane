"use client";

import { useState } from "react";
import { Columns3, ListPlus, Plus, X } from "lucide-react";
import { cn } from "@plane/utils";
import type { MatrixColumn, MatrixFilterOptions, MatrixFilterState } from "../types/matrix.types";
import { AxisViewToggle } from "./axis-view-toggle";
import { MatrixColumnsPanel } from "./matrix-columns-panel";
import { MatrixFilters } from "./matrix-filters";

type MatrixToolbarProps = {
  columns: MatrixColumn[];
  canCreateCard?: boolean;
  canCreatePlaylist: boolean;
  defaultVisibleColumnIds: readonly string[];
  disabled?: boolean;
  filters: MatrixFilterState;
  filterOptions: MatrixFilterOptions;
  hasActiveFilters: boolean;
  isCreatingPlaylist?: boolean;
  isSwitched: boolean;
  onAxisChange: (isSwitched: boolean) => void;
  onClearFilters: () => void;
  onClearSelection: () => void;
  onCreateCard?: () => void;
  onCreatePlaylist: () => void;
  onFiltersChange: (filters: MatrixFilterState) => void;
  onVisibleColumnIdsChange: (visibleColumnIds: string[]) => void;
  selectedCellCount: number;
  selectedPlayableRowCount: number;
  showFilters: boolean;
  visibleColumnIds: readonly string[];
};

export const MatrixToolbar = ({
  columns,
  canCreateCard = false,
  canCreatePlaylist,
  defaultVisibleColumnIds,
  disabled = false,
  filters,
  filterOptions,
  hasActiveFilters,
  isCreatingPlaylist = false,
  isSwitched,
  onAxisChange,
  onClearFilters,
  onClearSelection,
  onCreateCard,
  onCreatePlaylist,
  onFiltersChange,
  onVisibleColumnIdsChange,
  selectedCellCount,
  selectedPlayableRowCount,
  showFilters,
  visibleColumnIds,
}: MatrixToolbarProps) => {
  const [isColumnsPanelOpen, setIsColumnsPanelOpen] = useState(false);
  const visibleColumnIdSet = new Set(visibleColumnIds);
  const visibleColumnCount = columns.filter((column) => visibleColumnIdSet.has(column.id)).length;

  return (
    <div className="flex min-h-11 flex-col justify-center rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel-secondary)] px-3 py-1.5">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <AxisViewToggle disabled={disabled} isSwitched={isSwitched} onChange={onAxisChange} />
        <div className="flex items-center gap-1.5">
          {selectedCellCount > 0 ? (
            <>
              <span aria-live="polite" className="whitespace-nowrap text-[11px] text-[var(--sg-matrix-text-muted)]">
                {selectedCellCount} {selectedCellCount === 1 ? "cell" : "cells"} selected
              </span>
              <button
                type="button"
                aria-label="Clear selected matrix cells"
                disabled={disabled || isCreatingPlaylist}
                onClick={onClearSelection}
                className="inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-[11px] text-[var(--sg-matrix-text-muted)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setIsColumnsPanelOpen(true)}
            disabled={disabled || columns.length === 0}
            className={cn(
              "inline-flex h-7 items-center gap-2 rounded-[5px] border px-2.5 text-[11px] font-normal transition-colors",
              isColumnsPanelOpen
                ? "border-[var(--sg-matrix-active-border)] bg-[var(--sg-matrix-selected-nav)] text-[var(--sg-matrix-text)]"
                : "border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-selected-nav)] text-[var(--sg-matrix-text-secondary)] hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]",
              (disabled || columns.length === 0) && "cursor-not-allowed opacity-40"
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>Columns</span>
            <span className="text-[var(--sg-matrix-text-muted)]">
              {visibleColumnCount}/{columns.length}
            </span>
          </button>
          <button
            type="button"
            disabled={disabled || !canCreateCard}
            onClick={onCreateCard}
            className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-selected-nav)] px-2.5 text-[11px] font-normal text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] disabled:cursor-not-allowed disabled:text-[var(--sg-matrix-text-disabled)] disabled:opacity-45"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Card
          </button>
          <button
            type="button"
            disabled={disabled || !canCreatePlaylist || selectedPlayableRowCount === 0}
            onClick={onCreatePlaylist}
            title={
              selectedCellCount > 0 && selectedPlayableRowCount === 0
                ? "Selected tags do not contain playable timestamps"
                : undefined
            }
            className="inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-selected-nav)] px-2.5 text-[11px] font-normal text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)] disabled:cursor-not-allowed disabled:text-[var(--sg-matrix-text-disabled)] disabled:opacity-45"
          >
            <ListPlus className="h-3.5 w-3.5" />
            {isCreatingPlaylist ? "Creating" : "Create Playlist"}
          </button>
        </div>
      </div>
      {showFilters ? (
        <div className="hidden">
          <MatrixFilters
            disabled={disabled}
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            onChange={onFiltersChange}
            onClear={onClearFilters}
            options={filterOptions}
          />
        </div>
      ) : null}
      {isColumnsPanelOpen ? (
        <MatrixColumnsPanel
          columns={columns}
          defaultVisibleColumnIds={defaultVisibleColumnIds}
          onChange={onVisibleColumnIdsChange}
          onClose={() => setIsColumnsPanelOpen(false)}
          visibleColumnIds={visibleColumnIds}
        />
      ) : null}
    </div>
  );
};
