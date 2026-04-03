import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { HoHeaderFilter } from "./ho-header-filter";
import type { THoDisplayProperties } from "@/plane-web/store/ho/ho-issue.defaults";

type ColMeta = {
  label: string;
  asc?: string;
  desc?: string;
  filterKey?: string;
  width?: string;
  isNumber?: boolean;
};

const TH_CLASS = "h-11 items-center bg-layer-1 text-13 font-medium border-r-[0.5px] border-subtle select-none";

type Props = {
  displayProperties: THoDisplayProperties;
  isScrolled?: boolean;
};

export const HoDatasheetHeader = observer(function HoDatasheetHeader({ displayProperties, isScrolled = false }: Props) {
  const { t } = useTranslation();
  const store = useHoIssues();

  const options = store.filterOptions;

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
      filterKey: "main_task_category",
      width: "min-w-[180px]",
    },
    sub_task_category: {
      label: t("spreadsheet.columns.sub_task_category"),
      asc: "sub_task_category__name",
      desc: "-sub_task_category__name",
      filterKey: "sub_task_category",
      width: "min-w-[180px]",
    },
    name: {
      label: t("ho.work_items"),
      asc: "name",
      desc: "-name",
      width: "min-w-[400px]",
    },
    sub_issue_count: {
      label: "Sub Items",
      asc: "sub_issues_count",
      desc: "-sub_issues_count",
      isNumber: true,
      width: "min-w-[100px]",
    },
    project_lead: {
      label: t("spreadsheet.columns.project_lead"),
      asc: "project__project_lead__display_name",
      desc: "-project__project_lead__display_name",
      filterKey: "leads",
      width: "min-w-[150px]",
    },
    assignee: {
      label: "Assignee",
      filterKey: "assignees",
      width: "min-w-[180px]",
    },
    bank_wide_project: {
      label: t("spreadsheet.columns.bank_wide_project"),
      filterKey: "bank_wide",
      width: "min-w-[120px]",
    },
    priority: {
      label: "Priority",
      asc: "priority",
      desc: "-priority",
      filterKey: "priority",
      width: "min-w-[120px]",
    },
    state: {
      label: "Status",
      asc: "state__name",
      desc: "-state__name",
      filterKey: "state",
      width: "min-w-[140px]",
    },
    progress_tracking: {
      label: t("spreadsheet.columns.progress_tracking"),
      asc: "target_date",
      desc: "-target_date",
      filterKey: "progress",
      width: "min-w-[140px]",
    },
    modules: {
      label: t("sidebar.modules"),
      filterKey: "module",
      width: "min-w-[160px]",
    },
    cycle: {
      label: t("sidebar.cycles"),
      filterKey: "cycle",
      width: "min-w-[140px]",
    },
    start_date: {
      label: "Start Date",
      asc: "start_date",
      desc: "-start_date",
      width: "min-w-[140px]",
    },
    due_date: {
      label: "Due Date",
      asc: "target_date",
      desc: "-target_date",
      width: "min-w-[140px]",
    },
    completed_date: {
      label: t("spreadsheet.columns.completed_date"),
      asc: "completed_at",
      desc: "-completed_at",
      width: "min-w-[140px]",
    },
    total_log_time: {
      label: t("spreadsheet.columns.total_log_time"),
      asc: "total_log_time",
      desc: "-total_log_time",
      isNumber: true,
      width: "min-w-[120px]",
    },
    reference_link: {
      label: t("spreadsheet.columns.reference_link"),
      asc: "reference_link_count",
      desc: "-reference_link_count",
      isNumber: true,
      width: "min-w-[100px]",
    },
  };

  const getFilterOptions = (key: string) => {
    if (!options) return undefined;
    switch (key) {
      case "priority":
        return options.priorities?.map((p) => ({ value: p, label: t(`ho.priority.${p}`) }));
      case "state":
        return options.states?.map((s) => ({ value: s, label: s }));
      case "main_task_category":
        return options.main_task_categories?.map((c) => ({ value: c, label: c }));
      case "sub_task_category":
        return options.sub_task_categories?.map((c) => ({ value: c, label: c }));
      case "cycle":
        return options.cycles?.map((c) => ({ value: c, label: c }));
      case "module":
        return options.modules?.map((m) => ({ value: m, label: m }));
      case "assignees":
        return options.assignees?.map((a) => ({ value: a.id, label: a.display_name }));
      case "leads":
        return options.leads?.map((l) => ({ value: l.id, label: l.display_name }));
      case "progress":
        return options.progress?.map((p) => ({ value: p, label: t(`ho.progress_status.${p}`) }));
      case "bank_wide":
        return [
          { value: "true", label: t("common.yes") },
          { value: "false", label: t("common.no") },
        ];
      default:
        return undefined;
    }
  };

  const visibleKeys = Object.keys(COL_META).filter((key) => key === "name" || displayProperties[key] !== false);
  const firstVisibleKey = visibleKeys[0];

  const renderTh = (key: string) => {
    const meta = COL_META[key];
    if (!meta) return null;
    const isFirst = key === firstVisibleKey;

    const stickyClass = isFirst
      ? cn("sticky left-0 z-[15] transition-shadow", isScrolled ? "shadow-[2px_0_8px_rgba(0,0,0,0.1)]" : "")
      : "z-[10]";

    return (
      <th key={key} className={cn(TH_CLASS, meta.width, stickyClass, "p-0")}>
        <HoHeaderFilter
          label={meta.label}
          asc={meta.asc}
          desc={meta.desc}
          filterKey={meta.filterKey}
          options={getFilterOptions(meta.filterKey || "")}
          multiple={meta.filterKey !== "bank_wide"}
        />
      </th>
    );
  };

  return (
    <thead className="sticky top-0 left-0 z-[20] border-b-[0.5px] border-subtle bg-layer-1">
      <tr>{visibleKeys.map((key) => renderTh(key))}</tr>
    </thead>
  );
});
