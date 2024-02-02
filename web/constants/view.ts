import { TViewTypes } from "@plane/types";

export const VIEW_TYPES: Record<TViewTypes, TViewTypes> = {
  WORKSPACE_YOUR_VIEWS: "WORKSPACE_YOUR_VIEWS",
  WORKSPACE_VIEWS: "WORKSPACE_VIEWS",
  WORKSPACE_PROJECT_VIEWS: "WORKSPACE_PROJECT_VIEWS",
  PROJECT_VIEWS: "PROJECT_VIEWS",
  PROJECT_YOUR_VIEWS: "PROJECT_YOUR_VIEWS",
};

export const VIEW_DEFAULT_FILTER_PARAMETERS = {
  filters: {
    default: [
      "project",
      "priority",
      "state",
      "state_group",
      "assignees",
      "mentions",
      "subscriber",
      "created_by",
      "labels",
      "start_date",
      "target_date",
    ],
  },
  display_filters: {
    default: ["layout", "group_by", "sub_group_by", "order_by", "type", "sub_issue", "show_empty_groups", "calendar"],
  },
  display_properties: {
    default: [
      "assignee",
      "start_date",
      "due_date",
      "labels",
      "key",
      "priority",
      "state",
      "sub_issue_count",
      "link",
      "attachment_count",
      "estimate",
      "created_on",
      "updated_on",
    ],
  },
};
