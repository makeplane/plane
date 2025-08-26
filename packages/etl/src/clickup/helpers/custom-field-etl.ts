import {
  EIssuePropertyRelationType,
  EIssuePropertyType,
  ExIssueProperty,
  ExIssuePropertyValue,
  TPropertyValue,
} from "@plane/sdk";
import { E_IMPORTER_KEYS, getFormattedDateFromTimestamp, getTextPropertySettings } from "@/core";
import { TClickUpCustomField, TClickUpCustomFieldKeys, TClickUpUser } from "../types";
import { CLICKUP_TASK_CUSTOM_FIELD_OPTION_EXTERNAL_ID, CLICKUP_USER_EXTERNAL_ID } from "./key";

export type TSupportedClickUpCustomFieldTypes = Extract<
  TClickUpCustomFieldKeys,
  "short_text" | "email" | "users" | "drop_down" | "number" | "text" | "labels" | "date" | "checkbox"
>;

export const CLICKUP_SUPPORTED_CUSTOM_FIELD_ATTRIBUTES: Record<
  TSupportedClickUpCustomFieldTypes,
  Partial<ExIssueProperty>
> = {
  short_text: {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("single-line"),
  },
  email: {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("single-line"),
  },
  users: {
    property_type: EIssuePropertyType.RELATION,
    relation_type: EIssuePropertyRelationType.USER,
    is_multi: false,
  },
  drop_down: {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: false,
  },
  number: {
    property_type: EIssuePropertyType.DECIMAL,
    relation_type: undefined,
    is_multi: false,
  },
  text: {
    property_type: EIssuePropertyType.TEXT,
    relation_type: undefined,
    is_multi: false,
    settings: getTextPropertySettings("multi-line"),
  },
  labels: {
    property_type: EIssuePropertyType.OPTION,
    relation_type: undefined,
    is_multi: true,
  },
  date: {
    property_type: EIssuePropertyType.DATETIME,
    relation_type: undefined,
    is_multi: false,
  },
  checkbox: {
    property_type: EIssuePropertyType.BOOLEAN,
    relation_type: undefined,
    is_multi: false,
  },
};

/**
 * Get the attributes for a custom field based on the type
 * @param clickUpCustomField
 * @returns
 */
export const getPropertyAttributes = (clickUpCustomField: TClickUpCustomField): Partial<ExIssueProperty> => {
  if (!clickUpCustomField.type) {
    return {};
  }

  return {
    ...CLICKUP_SUPPORTED_CUSTOM_FIELD_ATTRIBUTES[clickUpCustomField.type as TSupportedClickUpCustomFieldTypes],
  };
};

/**
 * Get the values for a custom field based on the type
 * @param spaceId
 * @param folderId
 * @param customFieldWithValue
 * @returns
 */
export const getPropertyValues = (
  spaceId: string,
  folderId: string,
  customTaskTypeId: string,
  customFieldWithValue: TClickUpCustomField
): ExIssuePropertyValue => {
  const propertyValues: ExIssuePropertyValue = [];
  const commonPropertyProp: Partial<TPropertyValue> = {
    external_source: E_IMPORTER_KEYS.CLICKUP,
    external_id: undefined,
  };

  const value = customFieldWithValue.value;
  const customFieldId = customFieldWithValue.id;
  let optionId: string | undefined;
  if (customFieldWithValue.type === "drop_down") {
    optionId = customFieldWithValue.type_config.options.find((option) => option.orderindex === value)?.id;
  }
  if (!value) return [];

  switch (customFieldWithValue.type) {
    case "short_text":
      // Handle textfield
      propertyValues.push({
        ...commonPropertyProp,
        value: value as string,
      });
      break;
    case "email":
      // Handle url
      propertyValues.push({
        ...commonPropertyProp,
        value: value as string,
      });
      break;
    case "users":
      // Handle userpicker
      if (value && Array.isArray(value)) {
        value.forEach((user) => {
          propertyValues.push({
            ...commonPropertyProp,
            external_id: CLICKUP_USER_EXTERNAL_ID(spaceId, folderId, (user as TClickUpUser).id.toString()),
            value: (user as TClickUpUser).username,
          });
        });
      }
      break;
    case "drop_down":
      // Handle single select
      if (optionId) {
        propertyValues.push({
          ...commonPropertyProp,
          external_id: CLICKUP_TASK_CUSTOM_FIELD_OPTION_EXTERNAL_ID(
            spaceId,
            folderId,
            customTaskTypeId,
            customFieldId,
            optionId.toString()
          ),
          value: value as string,
        });
      }
      break;
    case "number":
      // Handle float
      propertyValues.push({
        ...commonPropertyProp,
        value: value as number,
      });
      break;
    case "text":
      // Handle textarea
      propertyValues.push({
        ...commonPropertyProp,
        value: value as string,
      });
      break;
    case "labels":
      // Handle multicheckboxes
      if (Array.isArray(value)) {
        value.forEach((val) => {
          propertyValues.push({
            ...commonPropertyProp,
            external_id: CLICKUP_TASK_CUSTOM_FIELD_OPTION_EXTERNAL_ID(
              spaceId,
              folderId,
              customTaskTypeId,
              customFieldId,
              val.toString()
            ),
            value: val as string,
          });
        });
      }
      break;
    case "date": {
      // Handle datetime
      const formattedDate = getFormattedDateFromTimestamp(Number(value)); // Format it to datetime format
      if (formattedDate) {
        propertyValues.push({
          ...commonPropertyProp,
          value: formattedDate,
        });
      }
      break;
    }

    case "checkbox":
      // Handle checkbox
      propertyValues.push({
        ...commonPropertyProp,
        value: value as string,
      });
      break;
    default:
      console.warn(`Unhandled ClickUp custom field type: ${customFieldWithValue.type}`);
  }

  return propertyValues;
};
