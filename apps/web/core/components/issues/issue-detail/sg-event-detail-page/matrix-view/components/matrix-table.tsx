"use client";

import type { CSSProperties, UIEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@plane/utils";
import type { MatrixCell, MatrixData, MatrixRow } from "../types/matrix.types";
import {
  getMatrixColumnVirtualRange,
  MATRIX_COLUMN_VIRTUALIZATION_THRESHOLD,
  MATRIX_COLUMN_WIDTH,
  MATRIX_FIRST_COLUMN_WIDTH,
  MATRIX_SUMMARY_COLUMNS_WIDTH,
} from "../utils/matrix-virtualization";
import { MatrixHeader } from "./matrix-header";
import { MatrixRow as MatrixTableRow } from "./matrix-row";

type MatrixTableProps = {
  activeRowId?: string | null;
  data: MatrixData;
  maxHeightClassName?: string;
  onCellActivate: (
    cell: MatrixCell,
    trigger: HTMLButtonElement,
    options?: { additive?: boolean; range?: boolean }
  ) => void;
  onCellDoubleClick?: (cell: MatrixCell) => void;
  openCellId?: string | null;
  selectedCellIds: ReadonlySet<string>;
  stickySummaries?: boolean;
};

const getRowGroup = (row: MatrixRow) => row.group ?? row.category ?? row.dimension ?? "";

const HEADER_HEIGHT = 180;
const ROW_HEIGHT = 44;
const ROW_OVERSCAN = 4;
const ROW_VIRTUALIZATION_THRESHOLD = 40;

const getColumnGroup = (column: MatrixData["columns"][number]) =>
  column.group ?? column.category ?? column.dimension ?? "";

export const MatrixTable = ({
  activeRowId,
  data,
  maxHeightClassName,
  onCellActivate,
  onCellDoubleClick,
  openCellId,
  selectedCellIds,
  stickySummaries = true,
}: MatrixTableProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const visibleColumns = useMemo(() => data.columns.filter((column) => column.visible), [data.columns]);
  const visibleRows = useMemo(() => data.rows.filter((row) => row.visible), [data.rows]);
  const shouldVirtualizeRows = visibleRows.length > ROW_VIRTUALIZATION_THRESHOLD;
  const shouldVirtualizeColumns = visibleColumns.length > MATRIX_COLUMN_VIRTUALIZATION_THRESHOLD;
  const [columnWidth, setColumnWidth] = useState(MATRIX_COLUMN_WIDTH);
  const [rowVirtualRange, setRowVirtualRange] = useState({ end: 20, start: 0 });
  const [columnVirtualRange, setColumnVirtualRange] = useState({ end: 20, start: 0 });
  const entityAxisLabel = useMemo(() => {
    const groups = Array.from(
      new Set(
        data.entities
          .filter((entity) => entity.visible && entity.dimension !== "unassigned")
          .map((entity) => entity.group)
          .filter((group): group is string => Boolean(group))
      )
    );
    return groups.length === 1 ? groups[0] : "Participants";
  }, [data.entities]);
  const firstColumnLabel = data.orientation === "entities-by-actions" ? "Actions" : (entityAxisLabel ?? "Participants");

  const updateVirtualRanges = useCallback(
    (scrollTop: number, scrollLeft: number, viewportHeight: number, viewportWidth: number) => {
      const availableColumnWidth =
        visibleColumns.length > 0
          ? Math.floor(
              (viewportWidth - MATRIX_FIRST_COLUMN_WIDTH - MATRIX_SUMMARY_COLUMNS_WIDTH) / visibleColumns.length
            )
          : MATRIX_COLUMN_WIDTH;
      const nextColumnWidth = Math.max(MATRIX_COLUMN_WIDTH, availableColumnWidth);
      setColumnWidth((currentWidth) => (currentWidth === nextColumnWidth ? currentWidth : nextColumnWidth));

      const nextRowRange = shouldVirtualizeRows
        ? {
            start: Math.max(0, Math.floor(Math.max(0, scrollTop - HEADER_HEIGHT) / ROW_HEIGHT) - ROW_OVERSCAN),
            end: 0,
          }
        : { end: visibleRows.length, start: 0 };
      if (shouldVirtualizeRows) {
        const visibleRowCount = Math.ceil(viewportHeight / ROW_HEIGHT) + ROW_OVERSCAN * 2;
        nextRowRange.end = Math.min(visibleRows.length, nextRowRange.start + visibleRowCount);
      }
      setRowVirtualRange((currentRange) =>
        currentRange.start === nextRowRange.start && currentRange.end === nextRowRange.end ? currentRange : nextRowRange
      );

      const nextColumnRange = getMatrixColumnVirtualRange({
        columnWidth: nextColumnWidth,
        columnCount: visibleColumns.length,
        scrollLeft,
        viewportWidth,
        virtualize: shouldVirtualizeColumns,
      });
      setColumnVirtualRange((currentRange) =>
        currentRange.start === nextColumnRange.start && currentRange.end === nextColumnRange.end
          ? currentRange
          : nextColumnRange
      );
    },
    [shouldVirtualizeColumns, shouldVirtualizeRows, visibleColumns.length, visibleRows.length]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const maximumScrollTop = Math.max(0, HEADER_HEIGHT + visibleRows.length * ROW_HEIGHT - container.clientHeight);
    if (container.scrollTop > maximumScrollTop) container.scrollTop = maximumScrollTop;
    updateVirtualRanges(container.scrollTop, container.scrollLeft, container.clientHeight, container.clientWidth);

    if (typeof ResizeObserver === "undefined") return;
    const resizeObserver = new ResizeObserver(() =>
      updateVirtualRanges(container.scrollTop, container.scrollLeft, container.clientHeight, container.clientWidth)
    );
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [updateVirtualRanges, visibleRows.length]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) =>
      updateVirtualRanges(
        event.currentTarget.scrollTop,
        event.currentTarget.scrollLeft,
        event.currentTarget.clientHeight,
        event.currentTarget.clientWidth
      ),
    [updateVirtualRanges]
  );
  const rowStart = shouldVirtualizeRows ? Math.min(rowVirtualRange.start, Math.max(0, visibleRows.length - 1)) : 0;
  const rowEnd = shouldVirtualizeRows
    ? Math.max(rowStart, Math.min(rowVirtualRange.end, visibleRows.length))
    : visibleRows.length;
  const columnStart = shouldVirtualizeColumns
    ? Math.min(columnVirtualRange.start, Math.max(0, visibleColumns.length - 1))
    : 0;
  const columnEnd = shouldVirtualizeColumns
    ? Math.max(columnStart, Math.min(columnVirtualRange.end, visibleColumns.length))
    : visibleColumns.length;
  const renderedRows = visibleRows.slice(rowStart, rowEnd);
  const renderedColumns = visibleColumns.slice(columnStart, columnEnd);
  const maxVisibleCount = useMemo(
    () =>
      visibleRows.reduce(
        (maxCount, row) => Math.max(maxCount, ...visibleColumns.map((column) => row.cells[column.id]?.count ?? 0)),
        0
      ),
    [visibleColumns, visibleRows]
  );
  const leadingColumnCount = columnStart;
  const trailingColumnCount = visibleColumns.length - columnEnd;
  const previousColumnGroup = columnStart > 0 ? getColumnGroup(visibleColumns[columnStart - 1]) : "";
  const physicalColumnCount =
    renderedColumns.length + (leadingColumnCount > 0 ? 1 : 0) + (trailingColumnCount > 0 ? 1 : 0) + 3;
  const matrixStyle = { "--sg-matrix-column-width": `${columnWidth}px` } as CSSProperties;

  return (
    <div
      ref={scrollContainerRef}
      aria-label={`${data.sport} tag matrix`}
      className={cn(
        "vertical-scrollbar horizontal-scrollbar scrollbar-lg min-h-52 w-full overflow-auto border-t border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-cell-empty)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
        maxHeightClassName ?? "max-h-[520px]"
      )}
      onScroll={handleScroll}
      role="region"
      style={matrixStyle}
      tabIndex={0}
    >
      <table
        aria-colcount={visibleColumns.length + 3}
        aria-rowcount={visibleRows.length + 1}
        className="min-w-max border-separate border-spacing-0 bg-[var(--sg-matrix-cell-empty)]"
      >
        <caption className="sr-only">
          {data.sport} tag matrix. Select populated cells to include tags in a playlist.
        </caption>
        <MatrixHeader
          columnStartIndex={columnStart}
          columns={renderedColumns}
          firstColumnLabel={firstColumnLabel}
          leadingSpacerWidth={leadingColumnCount * columnWidth}
          previousColumnGroup={previousColumnGroup}
          stickySummaries={stickySummaries}
          totalColumnCount={visibleColumns.length}
          trailingSpacerWidth={trailingColumnCount * columnWidth}
        />
        <tbody>
          {rowStart > 0 ? (
            <tr aria-hidden="true">
              <td colSpan={physicalColumnCount} style={{ height: rowStart * ROW_HEIGHT, padding: 0 }} />
            </tr>
          ) : null}
          {renderedRows.map((row, rowIndex) => {
            const absoluteRowIndex = rowStart + rowIndex;
            const group = getRowGroup(row);
            const previousGroup = absoluteRowIndex > 0 ? getRowGroup(visibleRows[absoluteRowIndex - 1]) : "";

            return (
              <MatrixTableRow
                key={row.id}
                activeRowId={activeRowId}
                ariaRowIndex={absoluteRowIndex + 2}
                columnStartIndex={columnStart}
                columns={renderedColumns}
                isGroupStart={absoluteRowIndex > 0 && group !== previousGroup}
                leadingSpacerWidth={leadingColumnCount * columnWidth}
                maxVisibleCount={maxVisibleCount}
                onCellActivate={onCellActivate}
                onCellDoubleClick={onCellDoubleClick}
                openCellId={openCellId}
                previousColumnGroup={previousColumnGroup}
                row={row}
                selectedCellIds={selectedCellIds}
                stickySummaries={stickySummaries}
                totalColumnCount={visibleColumns.length}
                trailingSpacerWidth={trailingColumnCount * columnWidth}
              />
            );
          })}
          {rowEnd < visibleRows.length ? (
            <tr aria-hidden="true">
              <td
                colSpan={physicalColumnCount}
                style={{ height: (visibleRows.length - rowEnd) * ROW_HEIGHT, padding: 0 }}
              />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};
