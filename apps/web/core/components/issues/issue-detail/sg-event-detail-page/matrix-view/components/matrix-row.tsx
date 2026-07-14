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
  onCellActivate: (cell: MatrixCellData, trigger: HTMLButtonElement) => void;
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
  onCellActivate,
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
          "sticky left-0 z-10 h-11 w-56 min-w-56 border-b border-r border-custom-border-200 bg-custom-background-100 px-4 text-left align-middle",
          isGroupStart && "border-t-2 border-t-custom-border-300"
        )}
        style={row.color ? { boxShadow: `inset 3px 0 0 ${row.color}` } : undefined}
      >
        <Tooltip tooltipContent={rowGroup ? `${row.label} · ${rowGroup}` : row.label} position="right">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium text-custom-text-100">{row.label}</span>
            {rowGroup ? (
              <span className="truncate text-[10px] font-normal text-custom-text-400">{rowGroup}</span>
            ) : null}
          </span>
        </Tooltip>
      </th>
      {leadingSpacerWidth > 0 ? (
        <td
          aria-hidden="true"
          className={cn(
            "h-11 border-b border-custom-border-100 bg-custom-background-100 p-0",
            isGroupStart && "border-t-2 border-t-custom-border-300"
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
            accentColor={column.color ?? row.color}
            ariaColumnIndex={columnStartIndex + columnIndex + 2}
            cell={cell}
            columnLabel={column.label}
            isActive={isActive}
            isGroupStart={isColumnGroupStart}
            isPanelOpen={cell?.id === openCellId}
            isRowGroupStart={isGroupStart}
            isSelected={Boolean(cell && selectedCellIds.has(cell.id))}
            onActivate={onCellActivate}
            rowLabel={row.label}
          />
        );
      })}
      {trailingSpacerWidth > 0 ? (
        <td
          aria-hidden="true"
          className={cn(
            "h-11 border-b border-custom-border-100 bg-custom-background-100 p-0",
            isGroupStart && "border-t-2 border-t-custom-border-300"
          )}
          style={{ minWidth: trailingSpacerWidth, width: trailingSpacerWidth }}
        />
      ) : null}
      <td
        aria-colindex={totalColumnCount + 2}
        className={cn(
          "h-11 w-[72px] min-w-[72px] border-b border-r border-l-2 border-custom-border-200 border-l-custom-border-300 bg-custom-background-90 px-2 text-center text-xs font-semibold text-custom-text-100",
          isGroupStart && "border-t-2 border-t-custom-border-300",
          stickySummaries && "lg:sticky lg:right-[72px] lg:z-10"
        )}
      >
        {row.total || "—"}
      </td>
      <td
        aria-colindex={totalColumnCount + 3}
        className={cn(
          "h-11 w-[72px] min-w-[72px] border-b border-custom-border-200 bg-custom-background-90 px-2 text-center text-xs text-custom-text-300",
          isGroupStart && "border-t-2 border-t-custom-border-300",
          stickySummaries && "lg:sticky lg:right-0 lg:z-10"
        )}
      >
        {formatAverage(row.average)}
      </td>
    </tr>
  );
});
