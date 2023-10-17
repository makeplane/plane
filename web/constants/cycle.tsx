import { GanttChart, Kanban, List } from "lucide-react";

export const CYCLE_TAB_LIST = [
  {
    key: "all",
    name: "All",
  },
  {
    key: "active",
    name: "Active",
  },
  {
    key: "upcoming",
    name: "Upcoming",
  },
  {
    key: "completed",
    name: "Completed",
  },
  {
    key: "draft",
    name: "Drafts",
  },
];

export const CYCLE_VIEWS = [
  {
    key: "list",
    icon: <List className="h-4 w-4" />,
  },
  {
    key: "board",
    icon: <Kanban className="h-4 w-4" />,
  },
  {
    key: "gantt",
    icon: <GanttChart className="h-4 w-4" />,
  },
];
