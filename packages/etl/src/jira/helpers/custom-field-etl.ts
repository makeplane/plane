import { EIssuePropertyRelationType, EIssuePropertyType, ExIssueProperty } from "@plane/sdk";
import { JiraCustomFieldKeys } from "../types/custom-fields";
import { getTextPropertySettings } from "@/core";

export const SUPPORTED_CUSTOM_FIELD_ATTRIBUTES: Record<JiraCustomFieldKeys, Partial<ExIssueProperty>> = {
  "com.atlassian.jira.plugin.system.customfieldtypes:textfield": {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("single-line"),
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:url": {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("single-line"),
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:userpicker": {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:select": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:float": {
    property_type: EIssuePropertyType.DECIMAL,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:textarea": {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("multi-line"),
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:multicheckboxes": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: true,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:datetime": {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:radiobuttons": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:multiselect": {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: true,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:datepicker": {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },
  "com.atlassian.jira.plugin.system.customfieldtypes:multiuserpicker": {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: true,
  },
};

export const OPTION_CUSTOM_FIELD_TYPES: JiraCustomFieldKeys[] = [
  "com.atlassian.jira.plugin.system.customfieldtypes:select",
  "com.atlassian.jira.plugin.system.customfieldtypes:multicheckboxes",
  "com.atlassian.jira.plugin.system.customfieldtypes:radiobuttons",
  "com.atlassian.jira.plugin.system.customfieldtypes:multiselect",
];
