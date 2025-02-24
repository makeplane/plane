import { GalleryVertical, GanttChartSquare, Kanban, List, LucideIcon } from "lucide-react";
// plane web types
import {
  EProjectLayouts,
  EProjectScope,
  TProjectGroupBy,
  TProjectSortBy,
  TProjectSortOrder,
} from "@/plane-web/types/workspace-project-filters";
import { EProjectAccess, EProjectPriority } from "@/plane-web/types/workspace-project-states";

// scope constants
type TProjectScopeMapObject<T> = { key: T; label: string };
type TProjectScopeMap = {
  [key in EProjectScope]: TProjectScopeMapObject<key>;
};
export const PROJECT_SCOPE_MAP: Partial<TProjectScopeMap> = {
  [EProjectScope.MY_PROJECTS]: {
    key: EProjectScope.MY_PROJECTS,
    label: "Your projects",
  },
  [EProjectScope.ALL_PROJECTS]: {
    key: EProjectScope.ALL_PROJECTS,
    label: "Browse all projects",
  },
};
export const PROJECT_SCOPES = Object.values(PROJECT_SCOPE_MAP);

// layout constants
type TProjectLayoutMapObject<T> = { key: T; title: string; label: string; icon: LucideIcon; selectivelyHide: boolean };
type TProjectLayoutMap = {
  [key in EProjectLayouts]: TProjectLayoutMapObject<key>;
};
export const PROJECT_LAYOUT_MAP: TProjectLayoutMap = {
  [EProjectLayouts.GALLERY]: {
    key: EProjectLayouts.GALLERY,
    title: "Gallery Layout",
    label: "Gallery",
    icon: GalleryVertical,
    selectivelyHide: false,
  },
  [EProjectLayouts.BOARD]: {
    key: EProjectLayouts.BOARD,
    title: "Board Layout",
    label: "Board",
    icon: Kanban,
    selectivelyHide: true,
  },
  [EProjectLayouts.TABLE]: {
    key: EProjectLayouts.TABLE,
    title: "List Layout",
    label: "Table",
    icon: List,
    selectivelyHide: false,
  },
  [EProjectLayouts.TIMELINE]: {
    key: EProjectLayouts.TIMELINE,
    title: "Timeline Layout",
    label: "Timeline",
    icon: GanttChartSquare,
    selectivelyHide: true,
  },
};
export const PROJECT_LAYOUTS = Object.values(PROJECT_LAYOUT_MAP);

// attribute constants
type TProjectPriorityMapObject<T> = { key: T; label: string };
type TProjectPriorityMap = {
  [key in EProjectPriority]: TProjectPriorityMapObject<key>;
};
type TProjectAccessMapObject<T> = { key: T; label: string };
type TProjectAccessMap = {
  [key in EProjectAccess]: TProjectAccessMapObject<key>;
};
export const PROJECT_PRIORITY_MAP: TProjectPriorityMap = {
  [EProjectPriority.NONE]: {
    key: EProjectPriority.NONE,
    label: "None",
  },
  [EProjectPriority.LOW]: { key: EProjectPriority.LOW, label: "Low" },
  [EProjectPriority.MEDIUM]: { key: EProjectPriority.MEDIUM, label: "Medium" },
  [EProjectPriority.HIGH]: { key: EProjectPriority.HIGH, label: "High" },
  [EProjectPriority.URGENT]: {
    key: EProjectPriority.URGENT,
    label: "Urgent",
  },
};
export const PROJECT_ACCESS_MAP: TProjectAccessMap = {
  [EProjectAccess.PUBLIC]: {
    key: EProjectAccess.PUBLIC,
    label: "Public",
  },
  [EProjectAccess.PRIVATE]: { key: EProjectAccess.PRIVATE, label: "Private" },
};
export const PROJECT_PRIORITIES = Object.values(PROJECT_PRIORITY_MAP);
export const PROJECT_ACCESS = Object.values(PROJECT_ACCESS_MAP);

// display filter constants
export const PROJECT_GROUP_BY_OPTIONS: {
  key: TProjectGroupBy;
  title: string;
}[] = [
  { key: "states", title: "States" },
  { key: "state_groups", title: "State Groups" },
  { key: "priority", title: "Priority" },
  { key: "created_by", title: "Created By" },
];

export const PROJECT_SORT_BY_OPTIONS: {
  key: TProjectSortBy;
  title: string;
}[] = [
  { key: "manual", title: "Manual" },
  { key: "name", title: "Name" },
  { key: "state", title: "State" },
  { key: "priority", title: "Priority" },
  { key: "created_date", title: "Created date" },
  { key: "start_date", title: "Start Date" },
  { key: "end_date", title: "End Date" },
  { key: "members_count", title: "Member Count" },
];

export const PROJECT_SORT_ORDER_OPTIONS: {
  key: TProjectSortOrder;
  title: string;
}[] = [
  { key: "asc", title: "Ascending" },
  { key: "desc", title: "Descending" },
];
