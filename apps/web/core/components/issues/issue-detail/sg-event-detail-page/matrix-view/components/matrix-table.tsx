"use client";

import type { UIEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MatrixCell, MatrixData, MatrixRow } from "../types/matrix.types";
import {
  getMatrixColumnVirtualRange,
  MATRIX_COLUMN_VIRTUALIZATION_THRESHOLD,
  MATRIX_COLUMN_WIDTH,
} from "../utils/matrix-virtualization";
import { MatrixHeader } from "./matrix-header";
import { MatrixRow as MatrixTableRow } from "./matrix-row";

type MatrixTableProps = {
  activeRowId?: string | null;
  data: MatrixData;
  onCellActivate: (cell: MatrixCell, trigger: HTMLButtonElement) => void;
  openCellId?: string | null;
  selectedCellIds: ReadonlySet<string>;
  stickySummaries?: boolean;
};

const getRowGroup = (row: MatrixRow) => row.group ?? row.category ?? row.dimension ?? "";

const HEADER_HEIGHT = 128;
const ROW_HEIGHT = 44;
const ROW_OVERSCAN = 4;
const ROW_VIRTUALIZATION_THRESHOLD = 40;

const getColumnGroup = (column: MatrixData["columns"][number]) =>
  column.group ?? column.category ?? column.dimension ?? "";

export const MatrixTable = ({
  activeRowId,
  data,
  onCellActivate,
  openCellId,
  selectedCellIds,
  stickySummaries = true,
}: MatrixTableProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const visibleColumns = useMemo(() => data.columns.filter((column) => column.visible), [data.columns]);
  const visibleRows = useMemo(() => data.rows.filter((row) => row.visible), [data.rows]);
  const shouldVirtualizeRows = visibleRows.length > ROW_VIRTUALIZATION_THRESHOLD;
  const shouldVirtualizeColumns = visibleColumns.length > MATRIX_COLUMN_VIRTUALIZATION_THRESHOLD;
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
  const firstColumnLabel = data.orientation === "entities-by-actions" ? (entityAxisLabel ?? "Entities") : "Actions";

  const updateVirtualRanges = useCallback(
    (scrollTop: number, scrollLeft: number, viewportHeight: number, viewportWidth: number) => {
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
  const leadingColumnCount = columnStart;
  const trailingColumnCount = visibleColumns.length - columnEnd;
  const previousColumnGroup = columnStart > 0 ? getColumnGroup(visibleColumns[columnStart - 1]) : "";
  const physicalColumnCount =
    renderedColumns.length + (leadingColumnCount > 0 ? 1 : 0) + (trailingColumnCount > 0 ? 1 : 0) + 3;

  return (
    <div
      ref={scrollContainerRef}
      aria-label={`${data.sport} tag matrix`}
      className="vertical-scrollbar horizontal-scrollbar scrollbar-lg max-h-[520px] min-h-52 w-full overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-custom-primary-100"
      onScroll={handleScroll}
      role="region"
      tabIndex={0}
    >
      <table
        aria-colcount={visibleColumns.length + 3}
        aria-rowcount={visibleRows.length + 1}
        className="min-w-max border-separate border-spacing-0 bg-custom-background-100"
      >
        <caption className="sr-only">
          {data.sport} tag matrix. Select a populated cell to open its tags and include it in a playlist.
        </caption>
        <MatrixHeader
          columnStartIndex={columnStart}
          columns={renderedColumns}
          firstColumnLabel={firstColumnLabel}
          leadingSpacerWidth={leadingColumnCount * MATRIX_COLUMN_WIDTH}
          previousColumnGroup={previousColumnGroup}
          stickySummaries={stickySummaries}
          totalColumnCount={visibleColumns.length}
          trailingSpacerWidth={trailingColumnCount * MATRIX_COLUMN_WIDTH}
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
                leadingSpacerWidth={leadingColumnCount * MATRIX_COLUMN_WIDTH}
                onCellActivate={onCellActivate}
                openCellId={openCellId}
                previousColumnGroup={previousColumnGroup}
                row={row}
                selectedCellIds={selectedCellIds}
                stickySummaries={stickySummaries}
                totalColumnCount={visibleColumns.length}
                trailingSpacerWidth={trailingColumnCount * MATRIX_COLUMN_WIDTH}
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
