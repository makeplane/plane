export const NAMESPACES = [
  "accessibility",
  "auth",
  "automation",
  "common",
  "cycle",
  "editor",
  "empty-state",
  "home",
  "inbox",
  "integration",
  "module",
  "navigation",
  "notification",
  "page",
  "power-k",
  "project",
  "project-settings",
  "settings",
  "stickies",
  "template",
  "tour",
  "update",
  "wiki",
  "work-item",
  "work-item-type",
  "workflow",
  "workspace",
  "workspace-settings",
] as const;

export type TNamespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: TNamespace = "common";
