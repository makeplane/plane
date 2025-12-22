// types
export const CYCLE_STATUS = [
  {
    i18n_label: "project_cycles.status.days_left" as const,
    value: "current" as const,
    i18n_title: "project_cycles.status.in_progress" as const,
    color: "#F59E0B",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    i18n_label: "project_cycles.status.yet_to_start" as const,
    value: "upcoming" as const,
    i18n_title: "project_cycles.status.yet_to_start" as const,
    color: "#3F76FF",
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    i18n_label: "project_cycles.status.completed" as const,
    value: "completed" as const,
    i18n_title: "project_cycles.status.completed" as const,
    color: "#16A34A",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    i18n_label: "project_cycles.status.draft" as const,
    value: "draft" as const,
    i18n_title: "project_cycles.status.draft" as const,
    color: "#525252",
    textColor: "text-tertiary",
    bgColor: "bg-surface-2",
  },
];
