import { observer } from "mobx-react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronsUpDown } from "lucide-react";
import { CustomMenu } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.defaults";

type ColMeta = {
  label: string;
  asc?: string;
  desc?: string;
  width?: string;
};

// Simplified TH to match core: remove extra borders and padding that might conflict with CustomMenu
const TH_CLASS = "h-11 items-center bg-layer-1 text-13 font-medium border-r-[0.5px] border-subtle select-none";

type Props = {
  displayProperties: THoDisplayProperties;
  orderBy: string;
  onOrderBy: (key: string) => void;
  isScrolled?: boolean;
};

export const HoDatasheetHeader = observer(function HoDatasheetHeader({
  displayProperties,
  orderBy,
  onOrderBy,
  isScrolled = false,
}: Props) {
  const { t } = useTranslation();

  const COL_META: Record<string, ColMeta> = {
    department_name: {
      label: t("spreadsheet.columns.department_name"),
      asc: "project__workspace__name",
      desc: "-project__workspace__name",
      width: "min-w-[180px]",
    },
    project_name: {
      label: t("spreadsheet.columns.project_name"),
      asc: "project__name",
      desc: "-project__name",
      width: "min-w-[180px]",
    },
    main_task_category: {
      label: t("spreadsheet.columns.main_task_category"),
      asc: "main_task_category__name",
      desc: "-main_task_category__name",
      width: "min-w-[180px]",
    },
    sub_task_category: {
      label: t("spreadsheet.columns.sub_task_category"),
      asc: "sub_task_category__name",
      desc: "-sub_task_category__name",
      width: "min-w-[180px]",
    },
    name: { label: t("ho.work_items"), width: "min-w-[400px]" },
    sub_issue_count: { label: "Sub Items", width: "min-w-[100px]" },
    project_lead: { label: t("spreadsheet.columns.project_lead"), width: "min-w-[150px]" },
    assignee: { label: "Assignee", width: "min-w-[180px]" },
    bank_wide_project: { label: t("spreadsheet.columns.bank_wide_project"), width: "min-w-[120px]" },
    priority: { label: "Priority", asc: "priority", desc: "-priority", width: "min-w-[120px]" },
    state: { label: "Status", asc: "state__name", desc: "-state__name", width: "min-w-[140px]" },
    progress_tracking: { label: t("spreadsheet.columns.progress_tracking"), width: "min-w-[140px]" },
    modules: { label: t("sidebar.modules"), width: "min-w-[160px]" },
    cycle: { label: t("sidebar.cycles"), width: "min-w-[140px]" },
    start_date: { label: "Start Date", asc: "start_date", desc: "-start_date", width: "min-w-[140px]" },
    due_date: { label: "Due Date", asc: "target_date", desc: "-target_date", width: "min-w-[140px]" },
    completed_date: { label: t("spreadsheet.columns.completed_date"), width: "min-w-[140px]" },
    total_log_time: { label: t("spreadsheet.columns.total_log_time"), width: "min-w-[120px]" },
    reference_link: { label: t("spreadsheet.columns.reference_link"), width: "min-w-[100px]" },
  };

  const visibleKeys = Object.keys(COL_META).filter((key) => key === "name" || displayProperties[key] !== false);
  const firstVisibleKey = visibleKeys[0];

  const renderTh = (key: string) => {
    const meta = COL_META[key];
    if (!meta) return null;
    const isSortable = !!(meta.asc || meta.desc);
    const isFirst = key === firstVisibleKey;

    const stickyClass = isFirst
      ? cn("sticky left-0 z-[15] transition-shadow", isScrolled ? "shadow-[2px_0_8px_rgba(0,0,0,0.1)]" : "")
      : "z-[10]";

    // Non-sortable
    if (!isSortable) {
      return (
        <th
          key={key}
          className={cn(TH_CLASS, meta.width, stickyClass, "px-4 py-3 text-secondary uppercase tracking-wider")}
        >
          {meta.label}
        </th>
      );
    }

    const isActive = orderBy === meta.asc || orderBy === meta.desc;
    const SortIcon =
      orderBy === meta.asc ? ArrowUpNarrowWide : orderBy === meta.desc ? ArrowDownWideNarrow : ChevronsUpDown;

    return (
      <th key={key} className={cn(TH_CLASS, meta.width, stickyClass, "p-0")}>
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
              <span className="truncate uppercase tracking-wider">{meta.label}</span>
              <div className="flex items-center gap-1">
                {isActive && <SortIcon className="h-3 w-3 flex-shrink-0" />}
                <ChevronsUpDown className={cn("h-3 w-3 flex-shrink-0 opacity-50", isActive && "hidden")} />
              </div>
            </div>
          }
          placement="bottom-start"
          closeOnSelect
        >
          {meta.asc && (
            <CustomMenu.MenuItem onClick={() => onOrderBy(meta.asc!)}>
              <span className="flex items-center gap-2">
                <ArrowUpNarrowWide className="h-3 w-3" /> {t("ho.ascending")}
              </span>
            </CustomMenu.MenuItem>
          )}
          {meta.desc && (
            <CustomMenu.MenuItem onClick={() => onOrderBy(meta.desc!)}>
              <span className="flex items-center gap-2">
                <ArrowDownWideNarrow className="h-3 w-3" /> {t("ho.descending")}
              </span>
            </CustomMenu.MenuItem>
          )}
          <CustomMenu.MenuItem onClick={() => onOrderBy("project__workspace__name")}>
            <span className="flex items-center gap-2 text-red-500">{t("ho.clear_sort")}</span>
          </CustomMenu.MenuItem>
        </CustomMenu>
      </th>
    );
  };

  return (
    <thead className="sticky top-0 left-0 z-[20] border-b-[0.5px] border-subtle bg-layer-1">
      <tr>{visibleKeys.map((key) => renderTh(key))}</tr>
    </thead>
  );
});
