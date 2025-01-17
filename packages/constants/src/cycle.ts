// types
export const CYCLE_STATUS: {
  label: string;
  value: "current" | "upcoming" | "completed" | "draft";
  title: string;
  color: string;
  textColor: string;
  bgColor: string;
}[] = [
  {
    label: "project_cycles.status.days_left",
    value: "current",
    title: "project_cycles.status.in_progress",
    color: "#F59E0B",
    textColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  {
    label: "project_cycles.status.yet_to_start",
    value: "upcoming",
    title: "project_cycles.status.yet_to_start",
    color: "#3F76FF",
    textColor: "text-blue-500",
    bgColor: "bg-indigo-50",
  },
  {
    label: "project_cycles.status.completed",
    value: "completed",
    title: "project_cycles.status.completed",
    color: "#16A34A",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    label: "project_cycles.status.draft",
    value: "draft",
    title: "project_cycles.status.draft",
    color: "#525252",
    textColor: "text-custom-text-300",
    bgColor: "bg-custom-background-90",
  },
];
