import {
  Attachment as JiraAttachment,
  Priority as JiraPriority,
  StatusDetails as JiraState,
} from "jira.js/out/version3/models";
import { ExIssueAttachment, ExState, ExIssueProperty, ExIssuePropertyValue, TPropertyValue } from "@plane/sdk";
import { E_IMPORTER_KEYS } from "@/core";
import { IPriorityConfig, IStateConfig, JiraCustomFieldKeys, JiraIssueField, PaginatedResponse } from "@/jira/types";
import { SUPPORTED_CUSTOM_FIELD_ATTRIBUTES } from "./custom-field-etl";
import { getFormattedDate } from "./date";

export const getTargetState = (stateMap: IStateConfig[], sourceState: JiraState): ExState | undefined => {
  if (!sourceState || !sourceState.id) {
    return undefined;
  }
  // Assign the external source and external id from jira and return the target state
  const targetState = stateMap.find((state: IStateConfig) => {
    if (state.source_state.id === sourceState.id) {
      state.target_state.external_source = E_IMPORTER_KEYS.JIRA;
      state.target_state.external_id = sourceState.id as string;
      return state;
    }
  });

  return targetState?.target_state;
};

export const getTargetAttachments = (
  resourceId: string,
  projectId: string,
  attachments?: JiraAttachment[]
): Partial<ExIssueAttachment[]> => {
  if (!attachments) {
    return [];
  }
  const attachmentArray = attachments
    .map((attachment: JiraAttachment): Partial<ExIssueAttachment | undefined> => {
      if (!attachment.id) {
        return;
      }

      return {
        external_id: `${projectId}_${resourceId}_${attachment.id}`,
        external_source: E_IMPORTER_KEYS.JIRA,
        attributes: {
          name: attachment.filename ?? "Untitled",
          size: attachment.size ?? 0,
        },
        asset: attachment.content ?? "",
      };
    })
    .filter((attachment) => attachment !== undefined) as ExIssueAttachment[];

  return attachmentArray;
};

export const getTargetPriority = (priorityMap: IPriorityConfig[], sourcePriority: JiraPriority): string | undefined => {
  if (!sourcePriority || !sourcePriority.name) {
    return undefined;
  }
  const targetPriority = priorityMap.find(
    (priority: IPriorityConfig) => priority.source_priority.name === sourcePriority.name
  );
  return targetPriority?.target_priority;
};

export const fetchPaginatedData = async <T>(
  fetchFunction: (startAt: number) => Promise<PaginatedResponse>,
  processFunction: (values: T[]) => void,
  listPropertyName: string
) => {
  let hasMore = true;
  let startAt = 0;
  let total = 0;

  while (hasMore) {
    const response = await fetchFunction(startAt);
    const values = response[listPropertyName] as T[]; // Type assertion
    if (response.total == 0) {
      break;
    }
    if (response && response.total && values) {
      total = response.total;
      processFunction(values);
      startAt += values.length;
      if (response.total <= startAt) {
        hasMore = false;
      }
    }
  }
};

export const getPropertyAttributes = (jiraIssueField: JiraIssueField): Partial<ExIssueProperty> => {
  if (!jiraIssueField.schema || !jiraIssueField.schema.custom) {
    return {};
  }

  return {
    ...SUPPORTED_CUSTOM_FIELD_ATTRIBUTES[jiraIssueField.schema.custom as JiraCustomFieldKeys],
  };
};

export const getPropertyValues = (
  customFieldType: JiraCustomFieldKeys,
  value: any,
  renderedValue: any
): ExIssuePropertyValue => {
  const propertyValues: ExIssuePropertyValue = [];
  const commonPropertyProp: Partial<TPropertyValue> = {
    external_source: E_IMPORTER_KEYS.JIRA,
    external_id: undefined,
  };

  if (!value) return [];

  switch (customFieldType) {
    case "com.atlassian.jira.plugin.system.customfieldtypes:textfield":
      // Handle textfield
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:url":
      // Handle url
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:userpicker":
      // Handle userpicker
      if (value.accountId && value.displayName) {
        propertyValues.push({
          ...commonPropertyProp,
          external_id: value.accountId,
          value: value.displayName,
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:select":
      // Handle single select
      propertyValues.push({
        ...commonPropertyProp,
        external_id: value.id,
        value: value.id,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:float":
      // Handle float
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:textarea":
      // Handle textarea
      if (renderedValue) {
        propertyValues.push({
          ...commonPropertyProp,
          value: renderedValue,
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:multicheckboxes":
      // Handle multicheckboxes
      if (Array.isArray(value)) {
        value.forEach((val) => {
          propertyValues.push({
            ...commonPropertyProp,
            external_id: val.id,
            value: val.id,
          });
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:datetime": {
      // Handle datetime
      const formattedDate = getFormattedDate(value); // Format it to datetime format
      if (formattedDate) {
        propertyValues.push({
          ...commonPropertyProp,
          value: formattedDate,
        });
      }
      break;
    }

    case "com.atlassian.jira.plugin.system.customfieldtypes:radiobuttons":
      // Handle radiobuttons
      propertyValues.push({
        ...commonPropertyProp,
        external_id: value.id,
        value: value.id,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:multiselect":
      // Handle multiselect
      if (Array.isArray(value)) {
        value.forEach((val) => {
          propertyValues.push({
            ...commonPropertyProp,
            external_id: val.id,
            value: val.id,
          });
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:datepicker":
      // Handle datepicker
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:multiuserpicker":
      // Handle multiuserpicker
      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (val.accountId && val.displayName) {
            propertyValues.push({
              ...commonPropertyProp,
              external_id: val.accountId,
              value: val.displayName,
            });
          }
        });
      }
      break;
    default:
      console.warn(`Unhandled custom field type: ${customFieldType}`);
  }

  return propertyValues;
};
