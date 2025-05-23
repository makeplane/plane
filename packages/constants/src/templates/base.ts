export enum ETemplateType {
  PROJECT = "project",
  WORK_ITEM = "workitem",
  PAGE = "page",
}

export enum ETemplateLevel {
  WORKSPACE = "workspace",
  PROJECT = "project",
}

export const TEMPLATE_KEYWORDS = [
  "Project management",
  "Task management",
  "Issue tracking",
  "Time tracking",
  "Reporting",
  "Automation",
  "Other",
] as const;
