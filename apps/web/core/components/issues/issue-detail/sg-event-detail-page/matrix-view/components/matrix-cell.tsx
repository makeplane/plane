import { memo } from "react";
import { cn } from "@plane/utils";
import type { MatrixCell as MatrixCellData } from "../types/matrix.types";

type MatrixCellProps = {
  ariaColumnIndex?: number;
  cell?: MatrixCellData;
  columnLabel: string;
  isActive: boolean;
  isGroupStart?: boolean;
  isPanelOpen: boolean;
  isRowGroupStart?: boolean;
  isSelected: boolean;
  maxVisibleCount: number;
  onActivate: (
    cell: MatrixCellData,
    trigger: HTMLButtonElement,
    options?: { additive?: boolean; range?: boolean }
  ) => void;
  onDoubleClick?: (cell: MatrixCellData) => void;
  rowLabel: string;
};

export const MatrixCell = memo(function MatrixCell({
  ariaColumnIndex,
  cell,
  columnLabel,
  isActive,
  isGroupStart = false,
  isPanelOpen,
  isRowGroupStart = false,
  isSelected,
  maxVisibleCount,
  onActivate,
  onDoubleClick,
  rowLabel,
}: MatrixCellProps) {
  const count = cell?.count ?? 0;
  const isInteractive = Boolean(cell && count > 0 && cell.sourceRowIds.length > 0);
  const intensityLevel = maxVisibleCount > 0 ? Math.max(1, Math.ceil((count / maxVisibleCount) * 4)) : 0;
  const cellBackground =
    intensityLevel >= 4
      ? "var(--sg-matrix-cell-l4)"
      : intensityLevel === 3
        ? "var(--sg-matrix-cell-l3)"
        : intensityLevel === 2
          ? "var(--sg-matrix-cell-l2)"
          : intensityLevel === 1
            ? "var(--sg-matrix-cell-l1)"
            : "var(--sg-matrix-cell-empty)";
  const isHighlighted = isSelected || isPanelOpen;

  return (
    <td
      aria-colindex={ariaColumnIndex}
      className={cn(
        "h-11 w-[var(--sg-matrix-column-width)] min-w-[var(--sg-matrix-column-width)] border-b border-r border-[var(--sg-matrix-grid-border)] bg-[var(--sg-matrix-cell-empty)] p-0 text-center",
        isGroupStart && "border-l border-l-[var(--sg-matrix-grid-border)]",
        isRowGroupStart && "border-t border-t-[var(--sg-matrix-grid-border)]"
      )}
    >
      {isInteractive && cell ? (
        <button
          type="button"
          aria-controls={isPanelOpen ? "matrix-matching-tags-panel" : undefined}
          aria-current={isActive ? "true" : undefined}
          aria-expanded={isPanelOpen}
          aria-label={`${count} ${count === 1 ? "tag" : "tags"} for ${rowLabel} and ${columnLabel}`}
          aria-pressed={isSelected}
          className={cn(
            "group relative flex h-full w-full items-center justify-center gap-1 text-[14px] font-medium text-[var(--sg-matrix-cell-text)] transition-[background-color,border-color,color,box-shadow] duration-150",
            "hover:brightness-110 focus-visible:z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sg-matrix-active-border)]",
            isHighlighted &&
              "text-[var(--sg-matrix-selected-cell-text)] ring-2 ring-inset ring-[var(--sg-matrix-selected-cell)] after:absolute after:inset-[2px] after:border after:border-[var(--sg-matrix-selected-cell-inner)] after:content-['']"
          )}
          data-matrix-cell-id={cell.id}
          onClick={(event) =>
            onActivate(cell, event.currentTarget, {
              additive: event.ctrlKey || event.metaKey,
              range: event.shiftKey,
            })
          }
          onDoubleClick={() => onDoubleClick?.(cell)}
          style={{ backgroundColor: cellBackground }}
        >
          <span className="relative z-[1]">{String(count).padStart(2, "0")}</span>
        </button>
      ) : (
        <span aria-label={`No tags for ${rowLabel} and ${columnLabel}`} className="sr-only">
          No tags
        </span>
      )}
    </td>
  );
});
