import { memo } from "react";
import { Check, Play } from "lucide-react";
import { cn } from "@plane/utils";
import type { MatrixCell as MatrixCellData } from "../types/matrix.types";

type MatrixCellProps = {
  accentColor?: string;
  ariaColumnIndex?: number;
  cell?: MatrixCellData;
  columnLabel: string;
  isActive: boolean;
  isGroupStart?: boolean;
  isPanelOpen: boolean;
  isRowGroupStart?: boolean;
  isSelected: boolean;
  onActivate: (cell: MatrixCellData, trigger: HTMLButtonElement) => void;
  rowLabel: string;
};

export const MatrixCell = memo(function MatrixCell({
  accentColor,
  ariaColumnIndex,
  cell,
  columnLabel,
  isActive,
  isGroupStart = false,
  isPanelOpen,
  isRowGroupStart = false,
  isSelected,
  onActivate,
  rowLabel,
}: MatrixCellProps) {
  const count = cell?.count ?? 0;
  const isInteractive = Boolean(cell && count > 0 && cell.sourceRowIds.length > 0);

  return (
    <td
      aria-colindex={ariaColumnIndex}
      className={cn(
        "h-11 w-[72px] min-w-[72px] border-b border-r border-custom-border-100 bg-custom-background-100 p-0 text-center",
        isGroupStart && "border-l-2 border-l-custom-border-300",
        isRowGroupStart && "border-t-2 border-t-custom-border-300"
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
            "group relative flex h-full w-full items-center justify-center gap-1 text-xs font-medium text-custom-text-200 transition-colors",
            "hover:bg-custom-background-80 hover:text-custom-text-100",
            "focus-visible:z-[1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-custom-primary-100",
            isSelected &&
              "bg-custom-primary-100/15 text-custom-primary-100 ring-1 ring-inset ring-custom-primary-100/70",
            isActive && "bg-custom-background-80 text-custom-text-100 ring-1 ring-inset ring-custom-text-300"
          )}
          data-matrix-cell-id={cell.id}
          onClick={(event) => onActivate(cell, event.currentTarget)}
          style={accentColor && !isSelected && !isActive ? { boxShadow: `inset 0 2px 0 ${accentColor}` } : undefined}
        >
          {isActive ? <Play aria-hidden="true" className="h-3 w-3 fill-current" /> : null}
          <span>{count}</span>
          {isSelected ? (
            <Check aria-hidden="true" className="absolute right-1 top-1 h-2.5 w-2.5" strokeWidth={2.5} />
          ) : null}
        </button>
      ) : (
        <span aria-label={`No tags for ${rowLabel} and ${columnLabel}`} className="text-xs text-custom-text-400">
          &mdash;
        </span>
      )}
    </td>
  );
});
