import { TPowerKPageKeys } from "./power-k/types";

// Placeholder map based on page keys
export const PAGE_PLACEHOLDERS: Record<TPowerKPageKeys | "default", string> = {
  "select-project": "Search projects",
  "select-cycle": "Search cycles",
  "select-module": "Search modules",
  "select-issue": "Search issues",
  "select-page": "Search pages",
  "select-view": "Search views",
  "select-state": "Search states",
  "select-priority": "Search priorities",
  "select-assignee": "Search assignees",
  "change-work-item-state": "Search states",
  "change-work-item-assignee": "Search assignees",
  "change-work-item-priority": "Search priorities",
  "change-module-member": "Search members",
  "change-module-status": "Search status",
  settings: "Search settings",
  "change-theme": "Select theme",
  default: "Type a command or search",
};
