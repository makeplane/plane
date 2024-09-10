export const ISSUE_FORM_TAB_INDICES = [
  "name",
  "description_html",
  "feeling_lucky",
  "ai_assistant",
  "state_id",
  "priority",
  "assignee_ids",
  "label_ids",
  "start_date",
  "target_date",
  "cycle_id",
  "module_ids",
  "estimate_point",
  "parent_id",
  "create_more",
  "discard_button",
  "draft_button",
  "submit_button",
  "project_id",
  "remove_parent",
];

export const INTAKE_ISSUE_CREATE_FORM_TAB_INDICES = [
  "name",
  "description_html",
  "state_id",
  "priority",
  "assignee_ids",
  "label_ids",
  "start_date",
  "target_date",
  "cycle_id",
  "module_ids",
  "estimate_point",
  "parent_id",
  "create_more",
  "discard_button",
  "submit_button",
];

export const CREATE_LABEL_TAB_INDICES = ["name", "color", "cancel", "submit"];

export const PROJECT_CREATE_TAB_INDICES = [
  "name",
  "identifier",
  "description",
  "network",
  "lead",
  "cancel",
  "submit",
  "close",
  "cover_image",
  "logo_props",
];

export const PROJECT_CYCLE_TAB_INDICES = ["name", "description", "date_range", "cancel", "submit", "project_id"];

export const PROJECT_MODULE_TAB_INDICES = [
  "name",
  "description",
  "date_range",
  "status",
  "lead",
  "member_ids",
  "cancel",
  "submit",
];

export const PROJECT_VIEW_TAB_INDICES = ["name", "description", "filters", "cancel", "submit"];

export const PROJECT_PAGE_TAB_INDICES = ["name", "public", "private", "cancel", "submit"];

export enum ETabIndices {
  ISSUE_FORM = "issue-form",
  INTAKE_ISSUE_FORM = "intake-issue-form",
  CREATE_LABEL = "create-label",
  PROJECT_CREATE = "project-create",
  PROJECT_CYCLE = "project-cycle",
  PROJECT_MODULE = "project-module",
  PROJECT_VIEW = "project-view",
  PROJECT_PAGE = "project-page",
}

export const TAB_INDEX_MAP: Record<ETabIndices, string[]> = {
  [ETabIndices.ISSUE_FORM]: ISSUE_FORM_TAB_INDICES,
  [ETabIndices.INTAKE_ISSUE_FORM]: INTAKE_ISSUE_CREATE_FORM_TAB_INDICES,
  [ETabIndices.CREATE_LABEL]: CREATE_LABEL_TAB_INDICES,
  [ETabIndices.PROJECT_CREATE]: PROJECT_CREATE_TAB_INDICES,
  [ETabIndices.PROJECT_CYCLE]: PROJECT_CYCLE_TAB_INDICES,
  [ETabIndices.PROJECT_MODULE]: PROJECT_MODULE_TAB_INDICES,
  [ETabIndices.PROJECT_VIEW]: PROJECT_VIEW_TAB_INDICES,
  [ETabIndices.PROJECT_PAGE]: PROJECT_PAGE_TAB_INDICES,
};
