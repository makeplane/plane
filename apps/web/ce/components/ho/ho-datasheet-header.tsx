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
};

const TH =
  "border-b border-subtle px-4 py-3 text-left text-12 font-medium text-secondary uppercase tracking-wide whitespace-nowrap";

type Props = {
  displayProperties: THoDisplayProperties;
  orderBy: string;
  onOrderBy: (key: string) => void;
};

export const HoDatasheetHeader = observer(function HoDatasheetHeader({ displayProperties, orderBy, onOrderBy }: Props) {
  const { t } = useTranslation();

  const COL_META: Record<string, ColMeta> = {
    department_name: {
      label: t("spreadsheet.columns.department_name"),
      asc: "project__workspace__name",
      desc: "-project__workspace__name",
    },
    project_name: {
      label: t("spreadsheet.columns.project_name"),
      asc: "project__name",
      desc: "-project__name",
    },
    main_task_category: {
      label: t("spreadsheet.columns.main_task_category"),
      asc: "main_task_category__name",
      desc: "-main_task_category__name",
    },
    sub_task_category: {
      label: t("spreadsheet.columns.sub_task_category"),
      asc: "sub_task_category__name",
      desc: "-sub_task_category__name",
    },
    name: { label: t("ho.work_items") },
    sub_issue_count: { label: "Sub Items" },
    project_lead: { label: t("spreadsheet.columns.project_lead") },
    assignee: { label: "Assignee" },
    bank_wide_project: { label: t("spreadsheet.columns.bank_wide_project") },
    priority: { label: "Priority", asc: "priority", desc: "-priority" },
    state: { label: "Status", asc: "state__name", desc: "-state__name" },
    progress_tracking: { label: t("spreadsheet.columns.progress_tracking") },
    modules: { label: t("sidebar.modules") },
    cycle: { label: t("sidebar.cycles") },
    start_date: { label: "Start Date", asc: "start_date", desc: "-start_date" },
    due_date: { label: "Due Date", asc: "target_date", desc: "-target_date" },
    completed_date: { label: t("spreadsheet.columns.completed_date") },
    total_log_time: { label: t("spreadsheet.columns.total_log_time") },
    reference_link: { label: t("spreadsheet.columns.reference_link") },
  };

  const visibleKeys = Object.keys(COL_META).filter((key) => key === "name" || displayProperties[key] !== false);
  const firstVisibleKey = visibleKeys[0];

  const renderTh = (key: string) => {
    const meta = COL_META[key];
    if (!meta) return null;
    const isSortable = !!(meta.asc || meta.desc);
    const isFirst = key === firstVisibleKey;

    const stickyClass = isFirst
      ? "sticky left-0 z-30 bg-surface-1 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
      : "bg-surface-1";

    if (!isSortable) {
      return (
        <th key={key} className={cn(TH, stickyClass)}>
          {meta.label}
        </th>
      );
    }

    const isActive = orderBy === meta.asc || orderBy === meta.desc;
    const SortIcon =
      orderBy === meta.asc ? ArrowUpNarrowWide : orderBy === meta.desc ? ArrowDownWideNarrow : ChevronsUpDown;

    return (
      <th key={key} className={cn(TH, stickyClass, "cursor-pointer")}>
        <CustomMenu
          label={
            <span className={`flex items-center gap-1 ${isActive ? "text-accent-primary" : ""}`}>
              {meta.label}
              <SortIcon className="h-3 w-3" />
            </span>
          }
          buttonClassName="text-12 font-medium uppercase tracking-wide text-secondary"
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
            {t("ho.clear_sort")}
          </CustomMenu.MenuItem>
        </CustomMenu>
      </th>
    );
  };

  return (
    <thead className="sticky top-0 z-20">
      <tr>{visibleKeys.map((key) => renderTh(key))}</tr>
    </thead>
  );
});
