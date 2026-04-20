import { useRef, useState, useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { HoHeaderFilter } from "./ho-header-filter";
import { HoCategoryRow } from "./ho-category-row";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";

const TH_CLASS = "h-11 items-center bg-layer-1 text-13 font-medium border-r-[0.5px] border-subtle select-none";

type Props = {
  data: THoCategorySummary[];
};

export const HoCategoryTable = observer(function HoCategoryTable({ data }: Props) {
  const { t } = useTranslation();
  const store = useHoIssues();
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

  const COLUMNS = [
    {
      key: "department_name",
      label: t("spreadsheet.columns.department_name"),
      asc: "project__workspace__name",
      desc: "-project__workspace__name",
      filterKey: "department",
      width: "min-w-[150px]",
    },
    {
      key: "main_task_category_name",
      label: t("spreadsheet.columns.main_task_category"),
      asc: "main_task_category__name",
      desc: "-main_task_category__name",
      filterKey: "main_task_category",
      width: "min-w-[160px]",
    },
    {
      key: "sub_task_category_name",
      label: t("spreadsheet.columns.sub_task_category"),
      asc: "sub_task_category__name",
      desc: "-sub_task_category__name",
      filterKey: "sub_task_category",
      width: "min-w-[160px]",
    },
  ];

  const getFilterOptions = (key: string) => {
    const summary = store.categorySummary;
    const { department: activeDepts, main_task_category: activeMain, sub_task_category: activeSub } = store.filters;

    const applyOthers = (exclude: string) => {
      let rows = summary;
      if (exclude !== "department" && activeDepts.length > 0)
        rows = rows.filter((r) => activeDepts.includes(r.department_name));
      if (exclude !== "main_task_category" && activeMain.length > 0)
        rows = rows.filter((r) => activeMain.includes(r.main_task_category_name));
      if (exclude !== "sub_task_category" && activeSub.length > 0)
        rows = rows.filter((r) => activeSub.includes(r.sub_task_category_name));
      return rows;
    };

    switch (key) {
      case "department": {
        const unique = [
          ...new Set(
            applyOthers("department")
              .map((r) => r.department_name)
              .filter(Boolean)
          ),
        ].sort();
        return unique.map((v) => ({ value: v, label: v }));
      }
      case "main_task_category": {
        const unique = [
          ...new Set(
            applyOthers("main_task_category")
              .map((r) => r.main_task_category_name)
              .filter(Boolean)
          ),
        ].sort();
        return unique.map((v) => ({ value: v, label: v }));
      }
      case "sub_task_category": {
        const unique = [
          ...new Set(
            applyOthers("sub_task_category")
              .map((r) => r.sub_task_category_name)
              .filter(Boolean)
          ),
        ].sort();
        return unique.map((v) => ({ value: v, label: v }));
      }
      default:
        return undefined;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto overflow-y-auto horizontal-scrollbar scrollbar-lg max-h-[calc(100vh-200px)] bg-surface-1"
    >
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 left-0 z-[20] border-b-[0.5px] border-subtle bg-layer-1">
          <tr className="h-11">
            {COLUMNS.map((col, idx) => {
              const isFirst = idx === 0;

              return (
                <th
                  key={col.key}
                  className={cn(
                    TH_CLASS,
                    col.width,
                    isFirst
                      ? cn("sticky left-0 z-[15]", isScrolled ? "shadow-[2px_0_8px_rgba(0,0,0,0.1)]" : "")
                      : "z-[10]",
                    "p-0"
                  )}
                >
                  <HoHeaderFilter
                    columnKey={col.key}
                    label={col.label}
                    asc={col.asc}
                    desc={col.desc}
                    filterKey={col.filterKey}
                    options={getFilterOptions(col.filterKey || "")}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const prev = idx > 0 ? data[idx - 1] : null;
            const isNewDeptGroup = !prev || prev.department_name !== row.department_name;
            return (
              <HoCategoryRow
                key={`${row.department_id}-${row.main_task_category_name}-${row.sub_task_category_name}`}
                rowIndex={idx}
                row={row}
                isNewDeptGroup={isNewDeptGroup}
                isScrolled={isScrolled}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
