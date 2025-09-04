type ExIssueTypeBase = {
  id?: string | undefined;

  workspace: string;
  project: string;
  parent?: string | undefined;

  external_id: string;
  external_source: string;

  updated_by: string;
  created_by: string;

  created_at: string;
  update_at: string;
};

// ====== issue types ======
export type ExIssueType = ExIssueTypeBase & {
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  is_epic: boolean;

  external_source: string;
  external_id: string;
};

// ====== issue type properties ======
export enum EIssuePropertyType {
  TEXT = "TEXT",
  DECIMAL = "DECIMAL",
  OPTION = "OPTION",
  BOOLEAN = "BOOLEAN",
  DATETIME = "DATETIME",
  RELATION = "RELATION",
}
export type TIssuePropertyType = keyof typeof EIssuePropertyType;

export enum EIssuePropertyRelationType {
  ISSUE = "ISSUE",
  USER = "USER",
}
export type TIssuePropertyRelationType = keyof typeof EIssuePropertyRelationType;

// Unique keys for issue property types
export type TIssuePropertyTypeKeys =
  | `${Exclude<EIssuePropertyType, EIssuePropertyType.RELATION>}`
  | `${EIssuePropertyType.RELATION}_${EIssuePropertyRelationType}`;

// settings
export type TTextSettingsDisplayOptions = "single-line" | "multi-line" | "readonly";
export type TTextSettings = {
  display_format: TTextSettingsDisplayOptions;
};

export type ExIssueProperty = ExIssueTypeBase & {
  display_name: string;
  description?: string | undefined;
  property_type: TIssuePropertyType;
  relation_type?: TIssuePropertyRelationType | undefined;
  default_value?: string[];
  settings?: TTextSettings | undefined;
  is_required?: boolean;
  is_active?: boolean;
  is_multi?: boolean;
  type_id?: string;
};

// ====== issue type options ======
export type ExIssuePropertyOption = ExIssueTypeBase & {
  name: string;
  description?: string | undefined;
  is_active?: boolean;
  is_default?: boolean;
  parent?: string | undefined;
  property_id?: string;
};

// ====== issue type values ======
export type TPropertyValue = {
  value: string | number;
  external_id?: string | undefined;
  external_source?: string | undefined;
};
export type ExIssuePropertyValue = TPropertyValue[];
