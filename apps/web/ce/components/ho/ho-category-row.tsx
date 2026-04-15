import { cn } from "@plane/utils";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";

type Props = {
  rowIndex: number;
  row: THoCategorySummary;
  isNewDeptGroup: boolean;
  isScrolled?: boolean;
};

const CELL =
  "border-b-[0.5px] border-r-[0.5px] border-subtle-1 px-4 py-2.5 text-13 text-primary align-middle transition-[background-color]";

export function HoCategoryRow({ rowIndex, row, isNewDeptGroup, isScrolled = false }: Props) {
  const rowBorder = isNewDeptGroup ? "border-t-[1.5px] border-subtle" : "";

  const frozenBg = rowIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-2";

  return (
    <tr
      className={cn(rowBorder, "odd:bg-surface-1 even:bg-surface-2 hover:bg-layer-2/50 transition-colors group h-11")}
    >
      <td
        className={cn(
          CELL,
          "min-w-[200px] sticky left-0 z-[5] transition-shadow",
          isScrolled ? "shadow-[2px_0_8px_rgba(0,0,0,0.1)]" : "",
          frozenBg,
          "group-hover:bg-layer-2"
        )}
      >
        <div className="truncate">{row.department_name || "—"}</div>
      </td>
      <td className={cn(CELL, "min-w-[220px]")}>
        <div className="truncate font-medium">{row.main_task_category_name || "—"}</div>
        {row.main_task_category_description && (
          <div className="truncate text-xs text-custom-text-300 font-normal italic mt-0.5">{row.main_task_category_description}</div>
        )}
      </td>
      <td className={cn(CELL, "min-w-[220px]")}>
        <div className="truncate">{row.sub_task_category_name || "—"}</div>
      </td>
    </tr>
  );
}
