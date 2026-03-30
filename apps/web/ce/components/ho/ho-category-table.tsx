import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoCategoryRow } from "./ho-category-row";

type SortKey = keyof THoCategorySummary;

const TH =
  "border-b border-subtle bg-surface-1 px-4 py-3 text-left text-12 font-medium text-secondary uppercase tracking-wide whitespace-nowrap cursor-pointer select-none";

type Props = {
  data: THoCategorySummary[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
};

export function HoCategoryTable({ data, sortKey, sortDir, onSort }: Props) {
  const { t } = useTranslation();

  const COLUMNS: { key: SortKey; label: string }[] = [
    { key: "department_name", label: t("spreadsheet.columns.department_name") },
    { key: "project_name", label: t("spreadsheet.columns.project_name") },
    { key: "main_task_category_name", label: t("spreadsheet.columns.main_task_category") },
    { key: "sub_task_category_name", label: t("spreadsheet.columns.sub_task_category") },
    { key: "work_item_count", label: t("ho.work_item_count") },
  ];

  return (
    <div className="relative overflow-x-auto overflow-y-auto horizontal-scrollbar scrollbar-lg max-h-[calc(100vh-200px)]">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-20">
          <tr>
            {COLUMNS.map((col, idx) => {
              const isActive = sortKey === col.key;
              const Icon = isActive ? (sortDir === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow) : ChevronsUpDown;
              const isFirst = idx === 0;
              return (
                <th
                  key={col.key}
                  className={cn(TH, isFirst && "sticky left-0 z-30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]")}
                  onClick={() => onSort(col.key)}
                >
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
                rowIndex={idx}
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
