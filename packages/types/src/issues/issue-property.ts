export type TIssuePropertyType = "text" | "number" | "date" | "boolean" | "select" | "multi_select";

export type TIssuePropertyOption = {
  value: string;
  color?: string;
};

export type TIssueProperty = {
  id: string;
  name: string;
  key: string;
  description?: string;
  property_type: TIssuePropertyType;
  options: TIssuePropertyOption[];
  default_value?: unknown;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  project_id: string;
  workspace_id: string;
  created_at?: string;
  updated_at?: string;
};

export type TIssueCustomFields = Record<string, string | number | boolean | string[] | null>;

export type TIssueCustomFieldsResponse = {
  custom_fields: TIssueCustomFields;
};

export type TIssuePropertyPayload = Partial<
  Pick<
    TIssueProperty,
    "name" | "description" | "property_type" | "options" | "default_value" | "is_required" | "sort_order" | "is_active"
  >
>;
