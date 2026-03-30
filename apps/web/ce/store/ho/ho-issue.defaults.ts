/** Returns today as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export type THoDisplayProperties = Record<string, boolean>;

// All 18 display columns enabled by default
export const HO_DEFAULT_DISPLAY_PROPERTIES: THoDisplayProperties = {
  department_name: true,
  project_name: true,
  main_task_category: true,
  sub_task_category: true,
  sub_issue_count: true,
  project_lead: true,
  assignee: true,
  bank_wide_project: true,
  priority: true,
  state: true,
  progress_tracking: true,
  modules: true,
  cycle: true,
  start_date: true,
  due_date: true,
  completed_date: true,
  total_log_time: true,
  reference_link: true,
};
