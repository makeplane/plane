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

const getColumnPalette = (column: MatrixColumn) => {
  const group = getColumnGroup(column).toLowerCase();
  const label = column.label.toLowerCase();
  if (column.dimension === "period" || group.includes("period") || label.includes("quarter")) {
    return { accent: "var(--sg-matrix-period-accent)", background: "var(--sg-matrix-period-bg)" };
  }
  if (group.includes("defense") || label.includes("defense")) {
    return { accent: "var(--sg-matrix-defense-accent)", background: "var(--sg-matrix-defense-bg)" };
  }
  if (group.includes("offense") || label.includes("offense")) {
    return { accent: "var(--sg-matrix-offense-accent)", background: "var(--sg-matrix-offense-bg)" };
  }
  if (group.includes("special") || label.includes("special")) {
    return { accent: "var(--sg-matrix-special-accent)", background: "var(--sg-matrix-special-bg)" };
  }
  if (column.dimension === "player") {
    return column.order % 3 === 1
      ? { accent: "var(--sg-matrix-defense-accent)", background: "var(--sg-matrix-defense-bg)" }
      : column.order % 3 === 2
        ? { accent: "var(--sg-matrix-neutral-accent)", background: "var(--sg-matrix-neutral-bg)" }
        : { accent: "var(--sg-matrix-offense-accent)", background: "var(--sg-matrix-offense-bg)" };
  }
  return { accent: "var(--sg-matrix-neutral-accent)", background: "var(--sg-matrix-neutral-bg)" };
};

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
        className="sticky left-0 top-0 z-30 h-[180px] w-[140px] min-w-[140px] border-b border-r border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] p-0 text-center align-middle text-[12px] font-medium text-[var(--sg-matrix-text-secondary)]"
      >
        <span className="flex h-full w-full items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap">{firstColumnLabel}</span>
        </span>
      </th>
      {leadingSpacerWidth > 0 ? (
        <th
          aria-hidden="true"
          className="h-[180px] border-b border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] p-0"
          style={{ minWidth: leadingSpacerWidth, width: leadingSpacerWidth }}
        />
      ) : null}
      {columns.map((column, columnIndex) => {
        const group = getColumnGroup(column);
        const previousGroup = columnIndex > 0 ? getColumnGroup(columns[columnIndex - 1]) : previousColumnGroup;
        const isGroupStart = (columnStartIndex > 0 || columnIndex > 0) && group !== previousGroup;
        const tooltipContent = group ? `${column.label} · ${group}` : column.label;
        const palette = getColumnPalette(column);

        return (
          <th
            key={column.id}
            aria-colindex={columnStartIndex + columnIndex + 2}
            scope="col"
            className={cn(
              "sticky top-0 z-20 h-[180px] w-[var(--sg-matrix-column-width)] min-w-[var(--sg-matrix-column-width)] border-b border-r border-[var(--sg-matrix-grid-border)] p-0 align-bottom text-[12px] font-medium text-[var(--sg-matrix-header-text)]",
              isGroupStart && "border-l border-l-[var(--sg-matrix-grid-border)]"
            )}
            style={{ backgroundColor: palette.background, borderBottomColor: palette.accent, borderBottomWidth: 3 }}
          >
            <Tooltip tooltipContent={tooltipContent} position="top">
              <span className="relative block h-full w-full overflow-hidden">
                <span className="absolute left-1/2 top-1/2 block w-[148px] origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 truncate whitespace-nowrap text-center leading-4">
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
          className="h-[180px] border-b border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] p-0"
          style={{ minWidth: trailingSpacerWidth, width: trailingSpacerWidth }}
        />
      ) : null}
      <th
        aria-colindex={totalColumnCount + 2}
        scope="col"
        className={cn(
          "sticky top-0 z-20 h-[180px] w-[44px] min-w-[44px] border-b border-r border-l border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] px-1 pb-3 text-center align-bottom text-[11px] font-medium text-[var(--sg-matrix-text-secondary)]",
          stickySummaries && "lg:right-[44px] lg:z-30"
        )}
      >
        Total
      </th>
      <th
        aria-colindex={totalColumnCount + 3}
        scope="col"
        className={cn(
          "sticky top-0 z-20 h-[180px] w-[44px] min-w-[44px] border-b border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-panel-secondary)] px-1 pb-3 text-center align-bottom text-[11px] font-medium text-[var(--sg-matrix-text-secondary)]",
          stickySummaries && "lg:right-0 lg:z-30"
        )}
      >
        Average
      </th>
    </tr>
  </thead>
);
