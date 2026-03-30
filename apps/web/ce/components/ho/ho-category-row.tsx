import { cn } from "@plane/utils";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";

type Props = {
  rowIndex: number;
  row: THoCategorySummary;
  isNewDeptGroup: boolean;
  isNewProjectGroup: boolean;
  isScrolled?: boolean;
};

const CELL =
  "border-b-[0.5px] border-r-[0.5px] border-subtle-1 px-4 py-2.5 text-13 text-primary align-middle truncate h-11 transition-[background-color]";

export function HoCategoryRow({ rowIndex, row, isNewDeptGroup, isNewProjectGroup, isScrolled = false }: Props) {
  const rowBorder = isNewDeptGroup
    ? "border-t-[1.5px] border-subtle"
    : isNewProjectGroup
      ? "border-t border-subtle"
      : "";

  const frozenBg = rowIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-2";

  return (
    <tr
      className={cn(rowBorder, "odd:bg-surface-1 even:bg-surface-2 hover:bg-layer-2/50 transition-colors group h-11")}
    >
      <td
        className={cn(
          CELL,
          "min-w-[140px] sticky left-0 z-10 transition-shadow",
          isScrolled ? "shadow-[8px_22px_22px_10px_rgba(0,0,0,0.05)]" : "",
          frozenBg,
          "group-hover:bg-layer-2"
        )}
      >
        {row.department_name || "—"}
      </td>
      <td className={cn(CELL, "min-w-[140px]")}>{row.project_name || "—"}</td>
      <td className={cn(CELL, "min-w-[160px]")}>{row.main_task_category_name || "—"}</td>
      <td className={cn(CELL, "min-w-[160px]")}>{row.sub_task_category_name || "—"}</td>
      <td className={cn(CELL, "min-w-[100px] text-right font-semibold")}>{row.work_item_count}</td>
    </tr>
  );
}
