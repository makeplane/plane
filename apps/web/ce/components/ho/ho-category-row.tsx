import { cn } from "@plane/utils";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";

type Props = {
  rowIndex: number;
  row: THoCategorySummary;
  isNewDeptGroup: boolean;
  isNewProjectGroup: boolean;
};

const CELL = "px-4 py-3 text-13 text-primary align-top border-b-[0.5px] border-subtle";

export function HoCategoryRow({ rowIndex, row, isNewDeptGroup, isNewProjectGroup }: Props) {
  const rowBorder = isNewDeptGroup
    ? "border-t-[1.5px] border-subtle"
    : isNewProjectGroup
      ? "border-t border-subtle"
      : "";

  const frozenBg = rowIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-2";

  return (
    <tr
      className={cn(
        rowBorder,
        "odd:bg-surface-1 even:bg-surface-2 hover:bg-layer-2/50 transition-colors group",
        "hover:[&>td.sticky]:bg-layer-2"
      )}
    >
      <td className={cn(CELL, "min-w-[140px] sticky left-0 z-[5] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]", frozenBg)}>
        {row.department_name || "—"}
      </td>
      <td className={`${CELL} min-w-[140px]`}>{row.project_name || "—"}</td>
      <td className={`${CELL} min-w-[160px]`}>{row.main_task_category_name || "—"}</td>
      <td className={`${CELL} min-w-[160px]`}>{row.sub_task_category_name || "—"}</td>
      <td className={`${CELL} min-w-[80px] text-right font-semibold`}>{row.work_item_count}</td>
    </tr>
  );
}
