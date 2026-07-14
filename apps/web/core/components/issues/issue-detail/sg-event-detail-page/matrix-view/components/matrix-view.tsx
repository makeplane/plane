"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@plane/utils";
import type { SportTableKind, SgTagRow } from "../../types";
import { useMatrixData } from "../hooks/use-matrix-data";
import { useMatrixSelection } from "../hooks/use-matrix-selection";
import type { MatrixCell, MatrixOrientation } from "../types/matrix.types";
import { getMatrixPlaylistRows } from "../utils/create-matrix-playlist";
import { MatrixEmptyState } from "./matrix-empty-state";
import { MatrixLoadingState } from "./matrix-loading-state";
import { MatrixTable } from "./matrix-table";
import { MatrixTagsPanel } from "./matrix-tags-panel";
import { MatrixToolbar } from "./matrix-toolbar";

export type MatrixViewProps = {
  activeRowId?: string | null;
  canCreatePlaylist?: boolean;
  className?: string;
  error?: Error | string | null;
  hasEvent?: boolean;
  isCreatingPlaylist?: boolean;
  isLoading?: boolean;
  onCreatePlaylist?: (rows: SgTagRow[]) => void | Promise<void>;
  onPlayTagRow?: (row: SgTagRow) => void | Promise<void>;
  sport: SportTableKind | string;
  tagRows: readonly SgTagRow[];
};

export const MatrixView = ({
  activeRowId,
  canCreatePlaylist,
  className,
  error = null,
  hasEvent = true,
  isCreatingPlaylist = false,
  isLoading = false,
  onCreatePlaylist,
  onPlayTagRow,
  sport,
  tagRows,
}: MatrixViewProps) => {
  const [isSwitched, setIsSwitched] = useState(false);
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const activeCellTriggerRef = useRef<HTMLButtonElement | null>(null);
  const orientation: MatrixOrientation = isSwitched ? "actions-by-entities" : "entities-by-actions";
  const {
    clearFilters,
    filteredSourceTags,
    filterOptions,
    filters,
    hasActiveFilters,
    matrix,
    sourceTags,
    sportResolution,
    setFilters,
  } = useMatrixData({ orientation, sport, tagRows });
  const { clearSelection, selectedCellIds, selectedSourceRowIds, selection, toggleCell } = useMatrixSelection(matrix);

  const tagRowsById = useMemo(() => new Map(tagRows.map((row) => [row.id, row])), [tagRows]);
  const selectedRows = useMemo(
    () => selectedSourceRowIds.map((rowId) => tagRowsById.get(rowId)).filter((row): row is SgTagRow => Boolean(row)),
    [selectedSourceRowIds, tagRowsById]
  );
  const selectedPlayableRows = useMemo(() => getMatrixPlaylistRows(selectedRows), [selectedRows]);
  const activeCell = activeCellId && matrix ? matrix.cells[activeCellId] : undefined;
  const activeCellRows = useMemo(
    () =>
      (activeCell?.sourceRowIds ?? [])
        .map((rowId) => tagRowsById.get(rowId))
        .filter((row): row is SgTagRow => Boolean(row)),
    [activeCell?.sourceRowIds, tagRowsById]
  );
  const activeCellContext = useMemo(() => {
    if (!activeCell || !matrix) return "Selected matrix cell";
    const actionLabel = matrix.actions.find((action) => action.id === activeCell.columnId)?.label;
    const entityLabel = matrix.entities.find((entity) => entity.id === activeCell.rowId)?.label;
    return [actionLabel, entityLabel].filter(Boolean).join(" · ") || "Selected matrix cell";
  }, [activeCell, matrix]);

  const handleCellActivate = useCallback(
    (cell: MatrixCell, trigger: HTMLButtonElement) => {
      activeCellTriggerRef.current = trigger;
      toggleCell(cell);
      setActiveCellId(cell.id);
    },
    [toggleCell]
  );
  const handleCloseTagsPanel = useCallback(() => {
    const trigger = activeCellTriggerRef.current;
    setActiveCellId(null);
    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  }, []);
  const handleCreatePlaylist = useCallback(() => {
    if (selectedPlayableRows.length > 0) void onCreatePlaylist?.(selectedPlayableRows);
  }, [onCreatePlaylist, selectedPlayableRows]);

  const hasError = error !== null && error !== undefined;
  const errorMessage = typeof error === "string" ? error : error?.message;
  const showFilters = hasEvent && !hasError && sportResolution.isSupported && sourceTags.length > 0;
  const playlistCapability = canCreatePlaylist ?? Boolean(onCreatePlaylist);

  return (
    <section
      aria-busy={isLoading}
      aria-label="Event tag matrix"
      className={cn(
        "min-w-0 overflow-hidden rounded border border-custom-border-200 bg-custom-background-100",
        className
      )}
    >
      <MatrixToolbar
        canCreatePlaylist={playlistCapability}
        disabled={isLoading || hasError || !hasEvent || !sportResolution.isSupported}
        filterOptions={filterOptions}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        isCreatingPlaylist={isCreatingPlaylist}
        isSwitched={isSwitched}
        onAxisChange={setIsSwitched}
        onClearFilters={clearFilters}
        onClearSelection={clearSelection}
        onCreatePlaylist={handleCreatePlaylist}
        onFiltersChange={setFilters}
        selectedCellCount={selection.length}
        selectedPlayableRowCount={selectedPlayableRows.length}
        showFilters={showFilters}
      />
      {isLoading ? (
        <MatrixLoadingState />
      ) : hasError ? (
        <MatrixEmptyState description={errorMessage} kind="error" />
      ) : !hasEvent ? (
        <MatrixEmptyState kind="empty-event" />
      ) : !sportResolution.isSupported ? (
        <MatrixEmptyState
          description={`Matrix View is not configured for ${sportResolution.input || "this event's sport"}.`}
          kind="unsupported-sport"
        />
      ) : sourceTags.length === 0 ? (
        <MatrixEmptyState kind="no-tags" />
      ) : hasActiveFilters && filteredSourceTags.length === 0 ? (
        <MatrixEmptyState kind="no-filter-results" />
      ) : matrix && matrix.rows.length > 0 ? (
        <div className="relative isolate min-h-52">
          <MatrixTable
            activeRowId={activeRowId}
            data={matrix}
            onCellActivate={handleCellActivate}
            openCellId={activeCell?.id}
            selectedCellIds={selectedCellIds}
          />
          {activeCell && activeCellRows.length > 0 ? (
            <MatrixTagsPanel
              activeRowId={activeRowId}
              contextLabel={activeCellContext}
              onClose={handleCloseTagsPanel}
              onPlayRow={onPlayTagRow}
              rows={activeCellRows}
            />
          ) : null}
        </div>
      ) : (
        <MatrixEmptyState kind="no-tags" />
      )}
    </section>
  );
};
