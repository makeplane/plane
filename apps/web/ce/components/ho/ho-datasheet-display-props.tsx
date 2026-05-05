import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";

export const HoDatasheetDisplayProps = observer(function HoDatasheetDisplayProps() {
  const { t } = useTranslation();
  const store = useHoIssues();
  const { displayProperties } = store;

  const COLUMN_LABELS: Record<string, string> = {
    department_name: t("spreadsheet.columns.department_name"),
    project_name: t("spreadsheet.columns.project_name"),
    main_task_category: t("spreadsheet.columns.main_task_category"),
    sub_task_category: t("spreadsheet.columns.sub_task_category"),
    sub_issue_count: "Number of Sub Work Items",
    project_lead: t("spreadsheet.columns.project_lead"),
    assignee: "Assignee",
    bank_wide_project: t("spreadsheet.columns.bank_wide_project"),
    priority: "Priority",
    state: "Status",
    progress_tracking: t("spreadsheet.columns.progress_tracking"),
    modules: t("sidebar.modules"),
    cycle: t("sidebar.cycles"),
    start_date: "Start Date",
    due_date: "Due Date",
    completed_date: t("spreadsheet.columns.completed_date"),
    total_log_time: t("spreadsheet.columns.total_log_time"),
    reference_link: t("spreadsheet.columns.reference_link"),
  };

  const handleToggle = (key: string) => {
    store.updateDisplayProperties({ [key]: !displayProperties[key] });
  };

  return (
    <div className="w-[480px] rounded-md border border-subtle bg-surface-1 p-3 shadow-md">
      <p className="mb-2 text-12 font-medium uppercase tracking-wide text-secondary">{t("ho.display_properties")}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {Object.entries(COLUMN_LABELS).map(([key, label]) => {
          const enabled = displayProperties[key] !== false;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleToggle(key)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-13 hover:bg-surface-2 transition-colors"
            >
              <span
                className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${
                  enabled ? "bg-accent-primary border-accent-primary" : "border-subtle"
                }`}
              >
                {enabled && (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-primary">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
