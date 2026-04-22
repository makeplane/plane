import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import * as XLSX from "xlsx";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { getProgressStatus } from "@/plane-web/components/issues/issue-layouts/progress-tracking-utils";
import { HoDatasheetDisplayProps } from "./ho-datasheet-display-props";
import { HoWorkspaceSelect } from "./ho-workspace-select";
import { HoProjectSelect } from "./ho-project-select";

export const HoDatasheetToolbar = observer(function HoDatasheetToolbar() {
  const { t } = useTranslation();
  const store = useHoIssues();
  const [showDisplayProps, setShowDisplayProps] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDisplayProps) return;
    const handler = (e: MouseEvent) => {
      if (displayRef.current && !displayRef.current.contains(e.target as Node)) {
        setShowDisplayProps(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDisplayProps]);

  const handleExport = () => {
    const dp = store.displayProperties;
    const rows = store.issues.map((issue) => {
      const row: Record<string, string | number> = {};
      if (dp.department_name !== false) row[t("spreadsheet.columns.department_name")] = issue.department_name ?? "-";
      if (dp.project_name !== false) row[t("spreadsheet.columns.project_name")] = issue.project_name ?? "-";
      row[t("ho.work_items")] = issue.name ?? "-";
      if (dp.main_task_category !== false) row[t("spreadsheet.columns.main_task_category")] = issue.main_task_category_name ?? "-";
      if (dp.sub_task_category !== false) row[t("spreadsheet.columns.sub_task_category")] = issue.sub_task_category_name ?? "-";
      if (dp.sub_issue_count !== false) row["Sub Items"] = issue.sub_issues_count ?? 0;
      if (dp.project_lead !== false) row[t("spreadsheet.columns.project_lead")] = issue.project_lead ?? "-";
      if (dp.assignee !== false) row["Assignee"] = issue.assignees?.map((a) => a.display_name).join(", ") || "-";
      if (dp.bank_wide_project !== false) row[t("spreadsheet.columns.bank_wide_project")] = issue.is_bank_wide_project ? "Y" : "N";
      if (dp.priority !== false) row["Priority"] = issue.priority ?? "-";
      if (dp.state !== false) row["Status"] = issue.state_name ?? "-";
      if (dp.progress_tracking !== false) row[t("spreadsheet.columns.progress_tracking")] = getProgressStatus(issue.target_date)?.label ?? "-";
      if (dp.modules !== false) row[t("sidebar.modules")] = issue.module_names?.join(", ") || "-";
      if (dp.cycle !== false) row[t("sidebar.cycles")] = issue.cycle_name ?? "-";
      if (dp.start_date !== false) row["Start Date"] = issue.start_date ?? "-";
      if (dp.due_date !== false) row["Due Date"] = issue.target_date ?? "-";
      if (dp.completed_date !== false) row[t("spreadsheet.columns.completed_date")] = issue.completed_at?.slice(0, 10) ?? "-";
      if (dp.total_log_time !== false) row[t("spreadsheet.columns.total_log_time")] = issue.total_log_time ?? 0;
      if (dp.reference_link !== false) row[t("spreadsheet.columns.reference_link")] = issue.reference_link_count ?? 0;
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datasheet");
    const datetime = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
    XLSX.writeFile(wb, `ho-datasheet-${datetime}.xlsx`);
  };

  const handleFromDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setDateRange(e.target.value, store.toDate);
  };

  const handleToDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setDateRange(store.fromDate, e.target.value);
  };

  return (
    <div className="relative flex items-center justify-between gap-3 border-b border-subtle bg-surface-1 px-page-x py-2">
      {/* Left: Date range pickers */}
      <div className="flex items-center gap-2">
        <span className="text-13 font-medium text-secondary">{t("ho.from")}</span>
        <input
          type="date"
          value={store.fromDate}
          onChange={handleFromDate}
          className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
        />
        <span className="text-13 font-medium text-secondary">{t("ho.to")}</span>
        <input
          type="date"
          value={store.toDate}
          onChange={handleToDate}
          className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
        />
      </div>

      {/* Right: Filters + Display toggle */}
      <div className="flex items-center gap-2">
        {/* Archive visibility toggle */}
        <label className="flex cursor-pointer items-center gap-1.5 select-none">
          <Switch value={store.showArchived} onChange={(v) => store.setShowArchived(v)} size="sm" />
          <span className="text-13 text-secondary">{t("ho.show_archived")}</span>
        </label>
        <HoWorkspaceSelect />
        <HoProjectSelect />
        <button
          type="button"
          onClick={() => setShowDisplayProps((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5 text-13 font-medium text-secondary hover:bg-layer-2 hover:text-primary transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("ho.display")}
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5 text-13 font-medium text-secondary hover:bg-layer-2 hover:text-primary transition-colors"
        >
          {t("workspace_views.export.button")}
        </button>
      </div>

      {/* Display properties popover */}
      {showDisplayProps && (
        <div ref={displayRef} className="absolute right-4 top-10 z-30">
          <HoDatasheetDisplayProps />
        </div>
      )}
    </div>
  );
});
