import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";

type Props = {
  row: THoCategorySummary;
  isNewDeptGroup: boolean;
  isNewProjectGroup: boolean;
};

const CELL = "px-4 py-3 text-13 text-primary align-top";

export function HoCategoryRow({ row, isNewDeptGroup, isNewProjectGroup }: Props) {
  const rowBorder = isNewDeptGroup
    ? "border-t-[1.5px] border-subtle"
    : isNewProjectGroup
      ? "border-t border-subtle"
      : "";

  return (
    <tr className={`${rowBorder} odd:bg-surface-1 even:bg-surface-2 hover:bg-layer-2/50 transition-colors`}>
      <td className={`${CELL} min-w-[140px]`}>{row.department_name || "—"}</td>
      <td className={`${CELL} min-w-[140px]`}>{row.project_name || "—"}</td>
      <td className={`${CELL} min-w-[160px]`}>{row.main_task_category_name || "—"}</td>
      <td className={`${CELL} min-w-[160px]`}>{row.sub_task_category_name || "—"}</td>
      <td className={`${CELL} min-w-[80px] text-right font-semibold`}>{row.work_item_count}</td>
    </tr>
  );
}
