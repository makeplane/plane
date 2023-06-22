import {
  CalendarDaysIcon,
  PlayIcon,
  Squares2X2Icon,
  TagIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export const SPREADSHEET_COLUMN = [
  {
    propertyName: "title",
    colName: "Title",
    colSize: "440px",
  },
  {
    propertyName: "state",
    colName: "State",
    colSize: "128px",
    icon: Squares2X2Icon,
    ascendingOrder: "state__name",
    descendingOrder: "-state__name",
  },
  {
    propertyName: "priority",
    colName: "Priority",
    colSize: "128px",
  },
  {
    propertyName: "assignee",
    colName: "Assignees",
    colSize: "128px",
    icon: UserGroupIcon,
    ascendingOrder: "assignees__name",
    descendingOrder: "-assignees__name",
  },
  {
    propertyName: "labels",
    colName: "Labels",
    colSize: "128px",
    icon: TagIcon,
    ascendingOrder: "labels__name",
    descendingOrder: "-labels__name",
  },
  {
    propertyName: "due_date",
    colName: "Due Date",
    colSize: "128px",
    icon: CalendarDaysIcon,
    ascendingOrder: "target_date",
    descendingOrder: "-target_date",
  },
  {
    propertyName: "estimate",
    colName: "Estimate",
    colSize: "128px",
    icon: PlayIcon,
    ascendingOrder: "estimate_point",
    descendingOrder: "-estimate_point",
  },
];
