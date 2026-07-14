import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import type { MatrixColumn } from "../types/matrix.types";

type MatrixHeaderProps = {
  columnStartIndex?: number;
  columns: MatrixColumn[];
  firstColumnLabel: string;
  leadingSpacerWidth?: number;
  previousColumnGroup?: string;
  stickySummaries?: boolean;
  totalColumnCount: number;
  trailingSpacerWidth?: number;
};

const getColumnGroup = (column: MatrixColumn) => column.group ?? column.category ?? column.dimension ?? "";

export const MatrixHeader = ({
  columnStartIndex = 0,
  columns,
  firstColumnLabel,
  leadingSpacerWidth = 0,
  previousColumnGroup = "",
  stickySummaries = true,
  totalColumnCount,
  trailingSpacerWidth = 0,
}: MatrixHeaderProps) => (
  <thead>
    <tr>
      <th
        aria-colindex={1}
        scope="col"
        className="sticky left-0 top-0 z-30 h-32 w-56 min-w-56 border-b border-r border-custom-border-200 bg-custom-background-90 px-4 text-left align-bottom text-xs font-medium text-custom-text-200"
      >
        <span className="block pb-3">{firstColumnLabel}</span>
      </th>
      {leadingSpacerWidth > 0 ? (
        <th
          aria-hidden="true"
          className="h-32 border-b border-custom-border-200 bg-custom-background-90 p-0"
          style={{ minWidth: leadingSpacerWidth, width: leadingSpacerWidth }}
        />
      ) : null}
      {columns.map((column, columnIndex) => {
        const group = getColumnGroup(column);
        const previousGroup = columnIndex > 0 ? getColumnGroup(columns[columnIndex - 1]) : previousColumnGroup;
        const isGroupStart = (columnStartIndex > 0 || columnIndex > 0) && group !== previousGroup;
        const tooltipContent = group ? `${column.label} · ${group}` : column.label;

        return (
          <th
            key={column.id}
            aria-colindex={columnStartIndex + columnIndex + 2}
            scope="col"
            className={cn(
              "sticky top-0 z-20 h-32 w-[72px] min-w-[72px] border-b border-r border-custom-border-200 bg-custom-background-90 p-0 align-bottom text-xs font-medium text-custom-text-200",
              isGroupStart && "border-l-2 border-l-custom-border-300"
            )}
            style={column.color ? { borderTopColor: column.color, borderTopWidth: 3 } : undefined}
          >
            <Tooltip tooltipContent={tooltipContent} position="top">
              <span className="flex h-full w-full flex-col items-center justify-end gap-2 overflow-hidden px-2 pb-3 pt-2">
                {column.color ? (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                ) : null}
                <span className="max-h-[92px] max-w-full truncate [writing-mode:vertical-rl] rotate-180">
                  {column.label}
                </span>
              </span>
            </Tooltip>
          </th>
        );
      })}
      {trailingSpacerWidth > 0 ? (
        <th
          aria-hidden="true"
          className="h-32 border-b border-custom-border-200 bg-custom-background-90 p-0"
          style={{ minWidth: trailingSpacerWidth, width: trailingSpacerWidth }}
        />
      ) : null}
      <th
        aria-colindex={totalColumnCount + 2}
        scope="col"
        className={cn(
          "sticky top-0 z-20 h-32 w-[72px] min-w-[72px] border-b border-r border-l-2 border-custom-border-200 border-l-custom-border-300 bg-custom-background-90 px-2 pb-3 text-center align-bottom text-xs font-medium text-custom-text-200",
          stickySummaries && "lg:right-[72px] lg:z-30"
        )}
      >
        Total
      </th>
      <th
        aria-colindex={totalColumnCount + 3}
        scope="col"
        className={cn(
          "sticky top-0 z-20 h-32 w-[72px] min-w-[72px] border-b border-custom-border-200 bg-custom-background-90 px-2 pb-3 text-center align-bottom text-xs font-medium text-custom-text-200",
          stickySummaries && "lg:right-0 lg:z-30"
        )}
      >
        Average
      </th>
    </tr>
  </thead>
);
