// plane imports
import { TIssue } from "@plane/types";

export const DEFAULT_WORK_ITEM_FORM_VALUES: Partial<TIssue> = {
  project_id: "",
  type_id: null,
  name: "",
  description_html: "",
  estimate_point: null,
  state_id: "",
  parent_id: null,
  priority: "none",
  assignee_ids: [],
  label_ids: [],
  cycle_id: null,
  module_ids: null,
  start_date: null,
  start_time: null,
  target_date: null,

  // Sport App Fields
  level : null,
  sport: null,
  program: null,
  year: null,
  category: null,
};
