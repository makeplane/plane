import { useRef, useState, useCallback, useEffect } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronsUpDown } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { THoCategorySummary } from "@/plane-web/services/ho-issue.service";
import { HoCategoryRow } from "./ho-category-row";

type SortKey = keyof THoCategorySummary;

const TH_CLASS = "h-11 items-center bg-layer-1 text-13 font-medium border-r-[0.5px] border-subtle select-none";

type Props = {
  data: THoCategorySummary[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey | "clear") => void;
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
    { key: "department_name", label: t("spreadsheet.columns.department_name"), width: "min-w-[200px]" },
    { key: "project_name", label: t("spreadsheet.columns.project_name"), width: "min-w-[200px]" },
    { key: "main_task_category_name", label: t("spreadsheet.columns.main_task_category"), width: "min-w-[220px]" },
    { key: "sub_task_category_name", label: t("spreadsheet.columns.sub_task_category"), width: "min-w-[220px]" },
    { key: "work_item_count", label: t("ho.work_item_count"), width: "min-w-[150px]" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative overflow-x-auto overflow-y-auto horizontal-scrollbar scrollbar-lg max-h-[calc(100vh-200px)] bg-surface-1"
    >
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 left-0 z-[20] border-b-[0.5px] border-subtle bg-layer-1">
          <tr className="h-11">
            {COLUMNS.map((col, idx) => {
              const isActive = sortKey === col.key;
              const Icon = isActive ? (sortDir === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow) : ChevronsUpDown;
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
                  <CustomMenu
                    className="!w-full h-full"
                    customButtonClassName="clickable !w-full h-full flex items-center px-4"
                    customButton={
                      <div
                        className={cn(
                          "flex w-full items-center justify-between gap-1.5 py-2 text-13 text-secondary hover:text-primary transition-colors",
                          isActive && "text-accent-primary"
                        )}
                      >
                        <span className="truncate uppercase tracking-wider">{col.label}</span>
                        <div className="flex items-center gap-1">
                          {isActive && <Icon className="h-3 w-3 flex-shrink-0" />}
                          <ChevronsUpDown className={cn("h-3 w-3 flex-shrink-0 opacity-50", isActive && "hidden")} />
                        </div>
                      </div>
                    }
                    placement="bottom-start"
                    closeOnSelect
                  >
                    <CustomMenu.MenuItem
                      onClick={() => {
                        if (sortKey === col.key && sortDir === "asc")
                          onSort(col.key); // toggles to desc
                        else onSort(col.key); // sets to asc
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <ArrowUpNarrowWide className="h-3 w-3" /> {t("ho.ascending")}
                      </span>
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        if (sortKey === col.key && sortDir === "desc")
                          onSort(col.key); // toggles to asc
                        else {
                          // this is a bit hacky with the current onSort but lets fix it properly in the parent
                          onSort(col.key);
                          onSort(col.key);
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <ArrowDownWideNarrow className="h-3 w-3" /> {t("ho.descending")}
                      </span>
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem onClick={() => onSort("clear")}>
                      <span className="flex items-center gap-2 text-red-500">{t("ho.clear_sort")}</span>
                    </CustomMenu.MenuItem>
                  </CustomMenu>
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
