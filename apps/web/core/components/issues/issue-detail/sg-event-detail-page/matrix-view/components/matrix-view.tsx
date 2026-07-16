"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@plane/utils";
import type { SportTableKind, SgTagRow } from "../../types";
import { useMatrixData } from "../hooks/use-matrix-data";
import { useMatrixSelection } from "../hooks/use-matrix-selection";
import type { MatrixCell, MatrixOrientation } from "../types/matrix.types";
import { orientMatrixData } from "../utils/build-matrix-data";
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
  layout?: "standard" | "workspace";
  onCreateCard?: (rows: SgTagRow[]) => void | Promise<void>;
  onCreatePlaylist?: (rows: SgTagRow[]) => void | Promise<void>;
  onFocusedRowsChange?: (rows: SgTagRow[]) => void;
  onPlayTagRow?: (row: SgTagRow) => void | Promise<void>;
  preferenceKey?: string;
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
  layout = "standard",
  onCreateCard,
  onCreatePlaylist,
  onFocusedRowsChange,
  onPlayTagRow,
  preferenceKey,
  sport,
  tagRows,
}: MatrixViewProps) => {
  const [isSwitched, setIsSwitched] = useState(false);
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const activeCellTriggerRef = useRef<HTMLButtonElement | null>(null);
  const orientation: MatrixOrientation = isSwitched ? "entities-by-actions" : "actions-by-entities";
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
  const [visibleColumnIdsByOrientation, setVisibleColumnIdsByOrientation] = useState<
    Partial<Record<MatrixOrientation, string[]>>
  >({});
  const displayedColumns = useMemo(() => matrix?.columns ?? [], [matrix?.columns]);
  const displayedColumnIds = useMemo(() => displayedColumns.map((column) => column.id), [displayedColumns]);
  const defaultVisibleColumnIds = useMemo(() => {
    const visibleColumns = displayedColumns.filter((column) => column.visible);
    const preferredColumns = visibleColumns.length > 0 ? visibleColumns : displayedColumns;
    return preferredColumns.slice(0, 14).map((column) => column.id);
  }, [displayedColumns]);
  const activeVisibleColumnIds = visibleColumnIdsByOrientation[orientation] ?? defaultVisibleColumnIds;
  const displayedMatrix = useMemo(() => {
    if (!matrix) return null;

    const visibleColumnIdSet = new Set(activeVisibleColumnIds);
    const markVisible = (column: (typeof matrix.actions)[number]) => ({
      ...column,
      visible: visibleColumnIdSet.has(column.id),
    });

    return orientMatrixData(
      {
        ...matrix,
        actions: orientation === "entities-by-actions" ? matrix.actions.map(markVisible) : matrix.actions,
        entities: orientation === "actions-by-entities" ? matrix.entities.map(markVisible) : matrix.entities,
      },
      orientation
    );
  }, [activeVisibleColumnIds, matrix, orientation]);
  const { clearSelection, selectedCellIds, selectedSourceRowIds, selection, selectCell } =
    useMatrixSelection(displayedMatrix);

  const tagRowsById = useMemo(() => new Map(tagRows.map((row) => [row.id, row])), [tagRows]);
  const selectedRows = useMemo(
    () => selectedSourceRowIds.map((rowId) => tagRowsById.get(rowId)).filter((row): row is SgTagRow => Boolean(row)),
    [selectedSourceRowIds, tagRowsById]
  );
  const selectedPlayableRows = useMemo(() => getMatrixPlaylistRows(selectedRows), [selectedRows]);
  const activeCell = activeCellId && displayedMatrix ? displayedMatrix.cells[activeCellId] : undefined;
  const activeCellRows = useMemo(
    () =>
      (activeCell?.sourceRowIds ?? [])
        .map((rowId) => tagRowsById.get(rowId))
        .filter((row): row is SgTagRow => Boolean(row)),
    [activeCell?.sourceRowIds, tagRowsById]
  );
  const focusedRows = activeCellRows.length > 0 ? activeCellRows : selectedRows;
  const activeCellContext = useMemo(() => {
    if (!activeCell || !displayedMatrix) return "Selected matrix cell";
    const actionLabel = displayedMatrix.actions.find((action) => action.id === activeCell.columnId)?.label;
    const entityLabel = displayedMatrix.entities.find((entity) => entity.id === activeCell.rowId)?.label;
    return [actionLabel, entityLabel].filter(Boolean).join(" · ") || "Selected matrix cell";
  }, [activeCell, displayedMatrix]);

  useEffect(() => {
    const columnIdSet = new Set(displayedColumnIds);

    setVisibleColumnIdsByOrientation((currentValue) => {
      const currentColumnIds = currentValue[orientation];
      if (!currentColumnIds) return currentValue;

      const nextValue = currentColumnIds.filter((columnId) => columnIdSet.has(columnId));
      if (nextValue.length === currentColumnIds.length) return currentValue;
      return { ...currentValue, [orientation]: nextValue };
    });
  }, [displayedColumnIds, orientation]);

  useEffect(() => {
    if (!preferenceKey || typeof window === "undefined") return;
    try {
      const storedValue = window.localStorage.getItem(preferenceKey);
      if (!storedValue) return;
      const parsedValue = JSON.parse(storedValue) as Partial<Record<MatrixOrientation, string[]>>;
      setVisibleColumnIdsByOrientation({
        "actions-by-entities": Array.isArray(parsedValue["actions-by-entities"])
          ? parsedValue["actions-by-entities"]
          : undefined,
        "entities-by-actions": Array.isArray(parsedValue["entities-by-actions"])
          ? parsedValue["entities-by-actions"]
          : undefined,
      });
    } catch {
      setVisibleColumnIdsByOrientation({});
    }
  }, [preferenceKey]);

  const handleCellActivate = useCallback(
    (cell: MatrixCell, trigger: HTMLButtonElement, options?: { additive?: boolean; range?: boolean }) => {
      activeCellTriggerRef.current = trigger;
      selectCell(cell, options?.range ? "range" : options?.additive ? "toggle" : "replace");
      setActiveCellId(cell.id);
    },
    [selectCell]
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
  const handleCreateCard = useCallback(() => {
    if (focusedRows.length > 0) void onCreateCard?.(focusedRows);
  }, [focusedRows, onCreateCard]);
  const handleVisibleColumnIdsChange = useCallback(
    (nextVisibleColumnIds: string[]) => {
      const nextValue = {
        ...visibleColumnIdsByOrientation,
        [orientation]: nextVisibleColumnIds,
      };
      setVisibleColumnIdsByOrientation(nextValue);
      if (preferenceKey && typeof window !== "undefined") {
        window.localStorage.setItem(preferenceKey, JSON.stringify(nextValue));
      }
      setActiveCellId(null);
      clearSelection();
    },
    [clearSelection, orientation, preferenceKey, visibleColumnIdsByOrientation]
  );

  const hasError = error !== null && error !== undefined;
  const errorMessage = typeof error === "string" ? error : error?.message;
  const showFilters = hasEvent && !hasError && sportResolution.isSupported && sourceTags.length > 0;
  const isWorkspaceLayout = layout === "workspace";
  const playlistCapability = canCreatePlaylist ?? Boolean(onCreatePlaylist);
  const selectedTagRowsForCard = activeCellRows.length > 0 ? activeCellRows : selectedRows;

  useEffect(() => {
    onFocusedRowsChange?.(focusedRows);
  }, [focusedRows, onFocusedRowsChange]);

  return (
    <section
      aria-busy={isLoading}
      aria-label="Event tag matrix"
      className={cn(
        "flex min-w-0 flex-col gap-2 overflow-hidden rounded-[5px] bg-transparent",
        isWorkspaceLayout && "border-0 bg-transparent",
        className
      )}
    >
      <MatrixToolbar
        columns={displayedColumns}
        canCreatePlaylist={playlistCapability}
        defaultVisibleColumnIds={defaultVisibleColumnIds}
        disabled={isLoading || hasError || !hasEvent || !sportResolution.isSupported}
        filterOptions={filterOptions}
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        isCreatingPlaylist={isCreatingPlaylist}
        isSwitched={isSwitched}
        canCreateCard={Boolean(onCreateCard) && selectedTagRowsForCard.length > 0}
        onAxisChange={setIsSwitched}
        onCreateCard={handleCreateCard}
        onClearFilters={clearFilters}
        onClearSelection={clearSelection}
        onCreatePlaylist={handleCreatePlaylist}
        onFiltersChange={setFilters}
        onVisibleColumnIdsChange={handleVisibleColumnIdsChange}
        selectedCellCount={selection.length}
        selectedPlayableRowCount={selectedPlayableRows.length}
        showFilters={showFilters}
        visibleColumnIds={activeVisibleColumnIds}
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
      ) : displayedMatrix && displayedMatrix.rows.length > 0 ? (
        <>
          <div
            className={cn(
              "relative isolate min-h-52 overflow-hidden rounded-[5px]",
              isWorkspaceLayout && "xl:grid xl:grid-cols-[minmax(0,1fr)_260px]"
            )}
          >
            <div className="min-w-0">
              <MatrixTable
                activeRowId={activeRowId}
                data={displayedMatrix}
                maxHeightClassName={isWorkspaceLayout ? "max-h-[calc(100vh-31rem)] min-h-[300px]" : undefined}
                onCellActivate={handleCellActivate}
                onCellDoubleClick={(cell) => {
                  const firstRow = cell.sourceRowIds.map((rowId) => tagRowsById.get(rowId)).find(Boolean);
                  if (firstRow) void onPlayTagRow?.(firstRow);
                }}
                openCellId={activeCell?.id}
                selectedCellIds={selectedCellIds}
                stickySummaries={!isWorkspaceLayout}
              />
            </div>
            {isWorkspaceLayout ? (
              <>
                <MatrixTagsPanel
                  activeRowId={activeRowId}
                  className="hidden w-[260px] shrink-0 xl:flex"
                  contextLabel={activeCell ? activeCellContext : "Select a matrix cell"}
                  isDocked
                  onClose={handleCloseTagsPanel}
                  onPlayRow={onPlayTagRow}
                  rows={activeCellRows}
                />
                {activeCell ? (
                  <MatrixTagsPanel
                    activeRowId={activeRowId}
                    className="xl:hidden"
                    contextLabel={activeCellContext}
                    onClose={handleCloseTagsPanel}
                    onPlayRow={onPlayTagRow}
                    rows={activeCellRows}
                  />
                ) : null}
              </>
            ) : activeCell && activeCellRows.length > 0 ? (
              <MatrixTagsPanel
                activeRowId={activeRowId}
                contextLabel={activeCellContext}
                onClose={handleCloseTagsPanel}
                onPlayRow={onPlayTagRow}
                rows={activeCellRows}
              />
            ) : null}
          </div>
        </>
      ) : (
        <MatrixEmptyState kind="no-tags" />
      )}
    </section>
  );
};
