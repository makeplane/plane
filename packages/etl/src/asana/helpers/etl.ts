import { ExIssueAttachment, ExIssuePropertyValue, ExState, TPropertyValue } from "@plane/sdk";
import {
  AsanaAttachment,
  AsanaCustomField,
  AsanaTaskComment,
  AsanaEnumOption,
  AsanaTask,
  AsanaUser,
  PriorityConfig,
  StateConfig,
} from "@/asana/types";
import { E_IMPORTER_KEYS } from "@/core";
import { getFormattedDate } from "./date";

export const getTargetAttachments = (attachments: AsanaAttachment[]): Partial<ExIssueAttachment>[] => {
  if (!attachments) return [];
  return attachments.map((attachment) => ({
    external_id: attachment.gid ?? "",
    external_source: E_IMPORTER_KEYS.ASANA,
    attributes: {
      name: attachment.name ?? "Untitled",
      size: attachment.size ?? 0,
    },
    asset: attachment.download_url ?? "",
  }));
};

export const getTargetState = (stateMap: StateConfig[], sourceState: string): ExState | undefined => {
  const targetState = stateMap.find((s) => s.source_state.id === sourceState);
  if (targetState) {
    targetState.target_state.external_source = E_IMPORTER_KEYS.ASANA;
    targetState.target_state.external_id = sourceState;
    return targetState.target_state;
  }
};

export const getTargetPriority = (
  priorityMap: PriorityConfig[],
  priorityFieldValue: AsanaEnumOption | null | undefined
): string | undefined => {
  const targetPriority = priorityMap.find((p) => p.source_priority.id === priorityFieldValue?.gid);
  return targetPriority?.target_priority;
};

export const mapAsanaAssignee = (task: AsanaTask, users: AsanaUser[]): string | undefined => {
  if (task.assignee) {
    const assignee = users.find((u) => u.gid === task.assignee?.gid);
    if (assignee) {
      const displayName = assignee.email.split("@")[0];
      return displayName;
    }
  }
};

export const mapAsanaCreator = (task: AsanaTask, users: AsanaUser[]): string | undefined => {
  if (task.created_by) {
    const creator = users.find((u) => u.gid === task.created_by?.gid);
    if (creator) {
      const displayName = creator.email.split("@")[0];
      return displayName;
    }
  }
};

export const mapAsanaState = (task: AsanaTask, projectGid: string): string | undefined => {
  if (task.memberships) {
    const state = task.memberships.find((m) => m.project.gid === projectGid);
    return state?.section.gid;
  }
};

export const getPropertyValues = (
  customField: AsanaCustomField,
  // eslint-disable-next-line no-undef
  asanaUsersMap: Map<string, AsanaUser>
): ExIssuePropertyValue => {
  const propertyValues: ExIssuePropertyValue = [];
  const commonPropertyProp: Partial<TPropertyValue> = {
    external_source: E_IMPORTER_KEYS.ASANA,
    external_id: undefined,
  };

  if (!customField || !customField.type) return [];

  switch (customField.type) {
    case "text":
      // Handle text field
      if (customField.text_value) {
        propertyValues.push({
          ...commonPropertyProp,
          value: customField.text_value,
        });
      }
      break;
    case "number":
      // Handle number field
      if (customField.number_value) {
        propertyValues.push({
          ...commonPropertyProp,
          value: customField.number_value,
        });
      }
      break;
    case "date": {
      // Handle date field
      const dateTimeValue = getFormattedDate(customField.date_value?.date_time);
      const dateValue = getFormattedDate(customField.date_value?.date);
      if (dateTimeValue) {
        propertyValues.push({
          ...commonPropertyProp,
          value: dateTimeValue,
        });
      } else if (dateValue) {
        propertyValues.push({
          ...commonPropertyProp,
          value: dateValue,
        });
      }
      break;
    }
    case "enum":
      // Handle enum field
      if (customField.enum_value?.gid) {
        propertyValues.push({
          ...commonPropertyProp,
          external_id: customField.enum_value.gid,
          value: customField.enum_value.gid,
        });
      }
      break;
    case "multi_enum":
      // Handle multi enum field
      if (customField.multi_enum_values?.length) {
        customField.multi_enum_values.forEach((val) => {
          if (val.gid) {
            propertyValues.push({
              ...commonPropertyProp,
              external_id: val.gid,
              value: val.gid,
            });
          }
        });
      }
      break;
    case "people":
      // Handle people field
      if (customField.people_value) {
        customField.people_value.forEach((val) => {
          if (val.gid) {
            const user = asanaUsersMap.get(val.gid);
            const displayName = user?.email.split("@")[0];
            if (displayName) {
              propertyValues.push({
                ...commonPropertyProp,
                external_id: val.gid,
                value: displayName,
              });
            }
          }
        });
      }
      break;
    default:
      console.warn(`Unhandled custom field type: ${customField.type}`);
  }

  return propertyValues;
};

export const mapAsanaCommentCreator = (comment: AsanaTaskComment, users: AsanaUser[]): string | undefined => {
  if (comment.created_by) {
    const creator = users.find((u) => u.gid === comment.created_by?.gid);
    if (creator) {
      const displayName = creator.email.split("@")[0];
      return displayName;
    }
  }
};
