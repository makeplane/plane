// plane types
import { TPowerKPageKeys } from "@plane/types";

export const POWER_K_PLACEHOLDER_TEXT: Record<TPowerKPageKeys | "default", string> = {
  // issue actions
  "change-issue-assignee": "Assign to",
  "change-issue-priority": "Change priority",
  "change-issue-state": "Change state",
  // module actions
  "change-module-member": "Add/remove members",
  "change-module-status": "Change status",
  // configs
  "workspace-settings": "Search workspace settings",
  "project-settings": "Search project settings",
  "profile-settings": "Search profile settings",
  // personalization
  "change-theme": "Change theme",
  default: "Type a command or search",
};
