import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronsUpDown } from "lucide-react";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoCategoryRow } from "./ho-category-row";

type SortKey = keyof THoCategorySummary;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "department_name", label: "Department" },
  { key: "project_name", label: "Team / Project" },
  { key: "main_task_category_name", label: "Main Task Category" },
  { key: "sub_task_category_name", label: "Sub Task Category" },
  { key: "work_item_count", label: "Number of Work Items" },
];

const TH =
  "border-b border-subtle bg-surface-1 px-4 py-3 text-left text-12 font-medium text-secondary uppercase tracking-wide whitespace-nowrap cursor-pointer select-none";

type Props = {
  data: THoCategorySummary[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
};

export function HoCategoryTable({ data, sortKey, sortDir, onSort }: Props) {
  return (
    <div className="overflow-x-auto horizontal-scrollbar scrollbar-lg">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isActive = sortKey === col.key;
              const Icon = isActive ? (sortDir === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow) : ChevronsUpDown;
              return (
                <th key={col.key} className={TH} onClick={() => onSort(col.key)}>
                  <span className={`flex items-center gap-1 ${isActive ? "text-accent-primary" : ""}`}>
                    {col.label}
                    <Icon className="h-3 w-3 flex-shrink-0" />
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const prev = idx > 0 ? data[idx - 1] : null;
            const isNewDeptGroup = !prev || prev.department_name !== row.department_name;
            const isNewProjectGroup = !isNewDeptGroup && !!prev && prev.project_name !== row.project_name;
            return (
              <HoCategoryRow
                key={`${row.project_id}-${row.main_task_category_name}-${row.sub_task_category_name}`}
                row={row}
                isNewDeptGroup={isNewDeptGroup}
                isNewProjectGroup={isNewProjectGroup}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
