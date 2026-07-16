import { memo } from "react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import type { MatrixCell as MatrixCellData, MatrixColumn, MatrixRow as MatrixRowData } from "../types/matrix.types";
import { MatrixCell } from "./matrix-cell";

type MatrixRowProps = {
  activeRowId?: string | null;
  ariaRowIndex?: number;
  columnStartIndex?: number;
  columns: MatrixColumn[];
  isGroupStart?: boolean;
  leadingSpacerWidth?: number;
  maxVisibleCount: number;
  onCellActivate: (
    cell: MatrixCellData,
    trigger: HTMLButtonElement,
    options?: { additive?: boolean; range?: boolean }
  ) => void;
  onCellDoubleClick?: (cell: MatrixCellData) => void;
  openCellId?: string | null;
  previousColumnGroup?: string;
  row: MatrixRowData;
  selectedCellIds: ReadonlySet<string>;
  stickySummaries?: boolean;
  totalColumnCount: number;
  trailingSpacerWidth?: number;
};

const getColumnGroup = (column: MatrixColumn) => column.group ?? column.category ?? column.dimension ?? "";

const formatAverage = (average: number) => {
  if (!Number.isFinite(average) || average === 0) return "—";
  return Number.isInteger(average) ? String(average) : average.toFixed(1);
};

export const MatrixRow = memo(function MatrixRow({
  activeRowId,
  ariaRowIndex,
  columnStartIndex = 0,
  columns,
  isGroupStart = false,
  leadingSpacerWidth = 0,
  maxVisibleCount,
  onCellActivate,
  onCellDoubleClick,
  openCellId,
  previousColumnGroup = "",
  row,
  selectedCellIds,
  stickySummaries = true,
  totalColumnCount,
  trailingSpacerWidth = 0,
}: MatrixRowProps) {
  const rowGroup = getColumnGroup(row);

  return (
    <tr aria-rowindex={ariaRowIndex}>
      <th
        aria-colindex={1}
        scope="row"
        className={cn(
          "sticky left-0 z-10 h-11 w-[140px] min-w-[140px] border-b border-r border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-row-label-bg)] px-2 text-left align-middle",
          isGroupStart && "border-t border-t-[var(--sg-matrix-grid-border)]"
        )}
      >
        <Tooltip tooltipContent={rowGroup ? `${row.label} · ${rowGroup}` : row.label} position="right">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-normal text-[var(--sg-matrix-row-label-text)]">{row.label}</span>
            {rowGroup ? (
              <span className="hidden truncate text-[10px] font-normal text-[var(--sg-matrix-text-muted)]">
                {rowGroup}
              </span>
            ) : null}
          </span>
        </Tooltip>
      </th>
      {leadingSpacerWidth > 0 ? (
        <td
          aria-hidden="true"
          className={cn(
            "h-11 border-b border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-cell-empty)] p-0",
            isGroupStart && "border-t border-t-[var(--sg-matrix-grid-border)]"
          )}
          style={{ minWidth: leadingSpacerWidth, width: leadingSpacerWidth }}
        />
      ) : null}
      {columns.map((column, columnIndex) => {
        const cell = row.cells[column.id];
        const columnGroup = getColumnGroup(column);
        const previousGroup = columnIndex > 0 ? getColumnGroup(columns[columnIndex - 1]) : previousColumnGroup;
        const isColumnGroupStart = (columnStartIndex > 0 || columnIndex > 0) && columnGroup !== previousGroup;
        const isActive = Boolean(activeRowId && cell?.sourceRowIds.includes(activeRowId));

        return (
          <MatrixCell
            key={`${row.id}-${column.id}`}
            ariaColumnIndex={columnStartIndex + columnIndex + 2}
            cell={cell}
            columnLabel={column.label}
            isActive={isActive}
            isGroupStart={isColumnGroupStart}
            isPanelOpen={cell?.id === openCellId}
            isRowGroupStart={isGroupStart}
            isSelected={Boolean(cell && selectedCellIds.has(cell.id))}
            maxVisibleCount={maxVisibleCount}
            onActivate={onCellActivate}
            onDoubleClick={onCellDoubleClick}
            rowLabel={row.label}
          />
        );
      })}
      {trailingSpacerWidth > 0 ? (
        <td
          aria-hidden="true"
          className={cn(
            "h-11 border-b border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-cell-empty)] p-0",
            isGroupStart && "border-t border-t-[var(--sg-matrix-grid-border)]"
          )}
          style={{ minWidth: trailingSpacerWidth, width: trailingSpacerWidth }}
        />
      ) : null}
      <td
        aria-colindex={totalColumnCount + 2}
        className={cn(
          "h-11 w-[44px] min-w-[44px] border-b border-r border-l border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] px-1 text-center text-[12px] font-medium text-[var(--sg-matrix-text-secondary)]",
          isGroupStart && "border-t border-t-[var(--sg-matrix-grid-border)]",
          stickySummaries && "lg:sticky lg:right-[44px] lg:z-10"
        )}
      >
        {row.total || "—"}
      </td>
      <td
        aria-colindex={totalColumnCount + 3}
        className={cn(
          "h-11 w-[44px] min-w-[44px] border-b border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] px-1 text-center text-[12px] text-[var(--sg-matrix-text-muted)]",
          isGroupStart && "border-t border-t-[var(--sg-matrix-grid-border)]",
          stickySummaries && "lg:sticky lg:right-0 lg:z-10"
        )}
      >
        {formatAverage(row.average)}
      </td>
    </tr>
  );
});
