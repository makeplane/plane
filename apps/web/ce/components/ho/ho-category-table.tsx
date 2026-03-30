import { useRef, useState, useCallback, useEffect } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoCategoryRow } from "./ho-category-row";

type SortKey = keyof THoCategorySummary;

const TH =
  "border-b-[0.5px] border-r-[0.5px] border-subtle-1 bg-surface-1 px-4 py-3 text-left text-12 font-semibold text-secondary uppercase tracking-wider whitespace-nowrap cursor-pointer select-none h-11 transition-shadow";

type Props = {
  data: THoCategorySummary[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
};

export function HoCategoryTable({ data, sortKey, sortDir, onSort }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    setIsScrolled(scrollLeft > 0);
  }, []);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const COLUMNS: { key: SortKey; label: string; width: string }[] = [
    { key: "department_name", label: t("spreadsheet.columns.department_name"), width: "w-[200px]" },
    { key: "project_name", label: t("spreadsheet.columns.project_name"), width: "w-[200px]" },
    { key: "main_task_category_name", label: t("spreadsheet.columns.main_task_category"), width: "w-[220px]" },
    { key: "sub_task_category_name", label: t("spreadsheet.columns.sub_task_category"), width: "w-[220px]" },
    { key: "work_item_count", label: t("ho.work_item_count"), width: "w-[150px]" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto overflow-y-auto horizontal-scrollbar scrollbar-lg max-h-[calc(100vh-200px)] bg-surface-1"
    >
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-40 bg-surface-1">
          <tr className="h-11">
            {COLUMNS.map((col, idx) => {
              const isActive = sortKey === col.key;
              const Icon = isActive ? (sortDir === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow) : ChevronsUpDown;
              const isFirst = idx === 0;

              return (
                <th
                  key={col.key}
                  className={cn(
                    TH,
                    col.width,
                    isFirst
                      ? cn("sticky left-0 z-30", isScrolled ? "shadow-[8px_-22px_22px_10px_rgba(0,0,0,0.05)]" : "")
                      : "z-20"
                  )}
                  onClick={() => onSort(col.key)}
                >
                  <span className={`flex items-center gap-1 ${isActive ? "text-accent-primary" : ""}`}>
                    <span className="truncate">{col.label}</span>
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
                isScrolled={isScrolled}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
