// types
import { TLogoProps } from "@plane/types";
// plane web types
import { TIssuePropertySettingsMap } from "@/plane-web/types/issue-types";

// Issue property types
export enum EIssuePropertyType {
  TEXT = "TEXT",
  DECIMAL = "DECIMAL",
  OPTION = "OPTION",
  BOOLEAN = "BOOLEAN",
  DATETIME = "DATETIME",
  RELATION = "RELATION",
}

// Issue property relation
export enum EIssuePropertyRelationType {
  ISSUE = "ISSUE",
  USER = "USER",
}

// Base issue property type
type TBaseIssueProperty = {
  id: string | undefined;
  name: string | undefined;
  display_name: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  sort_order: number | undefined;
  relation_type: EIssuePropertyRelationType | undefined;
  is_required: boolean | undefined;
  default_value: string[] | undefined;
  is_active: boolean | undefined;
  issue_type: string | undefined;
  is_multi: boolean | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
};

// Issue property type
export interface TIssueProperty<T extends EIssuePropertyType> extends TBaseIssueProperty {
  property_type: T | undefined;
  settings: TIssuePropertySettingsMap[T] | undefined;
}
