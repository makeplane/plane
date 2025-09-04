// plane sdk
import { EIssuePropertyRelationType, EIssuePropertyType, ExIssueProperty } from "@plane/sdk";
// silo core
import { AsanaCustomFieldType } from "@/asana/types";
import { getTextPropertySettings } from "@/core";
// types

export const CUSTOM_FIELD_ATTRIBUTES: Record<AsanaCustomFieldType, Partial<ExIssueProperty>> = {
  text: {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("multi-line"),
  },
  number: {
    property_type: EIssuePropertyType.DECIMAL,
    relation_type: undefined,
    is_multi: false,
  },
  enum: {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: false,
  },
  multi_enum: {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: true,
  },
  date: {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },
  people: {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: true,
  },
};
