export type TPowerKPageKeys =
  // issue actions
  | "change-issue-assignee"
  | "change-issue-priority"
  | "change-issue-state"
  // module actions
  | "change-module-member"
  | "change-module-status"
  // configs
  | "workspace-settings"
  | "project-settings"
  | "profile-settings"
  // personalization
  | "change-theme";

export type TPowerKCreateActionKeys = "cycle" | "issue" | "module" | "page" | "project" | "view" | "workspace";
export type TPowerKCreateAction = {
  key: TPowerKCreateActionKeys;
  icon: any;
  label: string;
  onClick: () => void;
  shortcut?: string;
  shouldRender?: boolean;
};
