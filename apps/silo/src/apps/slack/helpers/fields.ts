import { logger } from "@plane/logger";
import {
  BooleanField,
  DateField,
  E_KNOWN_FIELD_KEY,
  FormField,
  NumberField,
  RelationField,
  SelectField,
  TextField,
} from "@/types/form/base";
import { SlackBlockValue } from "../types/fields";
import { extractRichTextElements } from "./parse-issue-form";
import { convertToSlackOption, convertToSlackOptions, PlainTextOption } from "./slack-options";

export const getSlackBlock = (projectId: string, field: FormField, currentValue?: SlackBlockValue) => {
  switch (field.type) {
    case "TEXT":
    case "DECIMAL":
      return getTextBlock(field, currentValue as string);
    case "OPTION":
      return getSelectBlock(projectId, field, currentValue as PlainTextOption | PlainTextOption[]);
    case "DATETIME":
      return getDateField(field, currentValue as string);
    case "BOOLEAN":
      return getCheckboxBlock(field, currentValue as boolean);
    case "RELATION":
      return getExternalSelectBlock(projectId, field, currentValue as PlainTextOption | PlainTextOption[]);
    default:
      logger.error(`Unknown field type: ${field.type}`, { field });
      return null;
  }
};

const getTextBlock = (field: TextField | NumberField, currentValue?: string) => {
  if (field.id === E_KNOWN_FIELD_KEY.DESCRIPTION_HTML) {
    return {
      type: "input" as const,
      optional: !field.required,
      element: {
        type: "rich_text_input" as const,
        action_id: field.id,
        initial_value: {
          type: "rich_text" as const,
          elements: currentValue ? extractRichTextElements(field.name, currentValue as any) : [],
        },
        placeholder: {
          type: "plain_text" as const,
          text: field.placeholder || field.name,
        },
      },
      label: {
        type: "plain_text" as const,
        text: field.placeholder || field.name,
        emoji: true,
      },
    };
  } else {
    return {
      type: "input",
      optional: !field.required,
      element: {
        type: "plain_text_input",
        action_id: field.id,
        multiline: field.isMulti,
        initial_value: currentValue,
      },
      label: {
        type: "plain_text",
        text: field.placeholder || field.name,
        emoji: true,
      },
    };
  }
};

const getSelectBlock = (projectId: string, field: SelectField, currentValue?: PlainTextOption[] | PlainTextOption) => {
  const hasStaticOptions = field.options && field.options.length > 0;
  return hasStaticOptions
    ? getStaticSelectBlock(projectId, field, currentValue)
    : getExternalSelectBlock(projectId, field, currentValue);
};

const getStaticSelectBlock = (
  projectId: string,
  field: SelectField,
  currentValue?: PlainTextOption[] | PlainTextOption
) => {
  const isMulti = field.isMulti;
  const elementType = isMulti ? "multi_static_select" : "static_select";

  return {
    type: "input",
    optional: !field.required,
    element: {
      type: elementType,
      placeholder: {
        type: "plain_text",
        text: field.placeholder || (isMulti ? "Select options" : "Select an option"),
        emoji: true,
      },
      ...(isMulti
        ? {
            initial_options: currentValue && Array.isArray(currentValue) ? currentValue : undefined,
          }
        : {
            initial_option: currentValue && typeof currentValue === "object" ? currentValue : undefined,
          }),
      options: field.options.map((option) => ({
        text: {
          type: "plain_text",
          text: option.label,
          emoji: true,
        },
        value: option.value,
      })),
      action_id: `${projectId}.${field.id}`,
    },
    label: {
      type: "plain_text",
      text: field.placeholder || field.name,
      emoji: true,
    },
  };
};

const getExternalSelectBlock = (
  projectId: string,
  field: SelectField | RelationField,
  currentValue?: PlainTextOption[] | PlainTextOption
) => {
  const isMulti = field.isMulti;
  const elementType = isMulti ? "multi_external_select" : "external_select";

  return {
    type: "input",
    optional: !field.required,
    element: {
      type: elementType,
      placeholder: {
        type: "plain_text",
        text: field.placeholder || (isMulti ? "Select options" : "Select an option"),
        emoji: true,
      },
      ...(isMulti
        ? {
            initial_options: currentValue && Array.isArray(currentValue) ? currentValue : undefined,
          }
        : {
            initial_option: currentValue && typeof currentValue === "object" ? currentValue : undefined,
          }),
      min_query_length: 3,
      action_id: `${projectId}.${field.id}`,
    },
    label: {
      type: "plain_text",
      text: field.placeholder || field.name,
      emoji: true,
    },
  };
};

const getDateField = (field: DateField, currentValue?: string) => ({
  type: "input",
  optional: !field.required,
  dispatch_action: false,
  element: {
    type: "datepicker",
    initial_date: currentValue || field.defaultValue,
    placeholder: {
      type: "plain_text",
      text: "Select a date",
      emoji: true,
    },
    action_id: field.id,
  },
  label: {
    type: "plain_text",
    text: field.placeholder || field.name,
    emoji: true,
  },
});

const getCheckboxBlock = (field: BooleanField, currentValue?: boolean) => ({
  type: "input",
  optional: !field.required,
  dispatch_action: false,
  element: {
    type: "checkboxes",
    options: [
      {
        text: {
          type: "plain_text",
          text: field.placeholder || field.name,
          emoji: true,
        },
        description: field.helpText
          ? {
              type: "plain_text",
              text: field.helpText,
            }
          : undefined,
        value: currentValue !== undefined ? currentValue.toString() : field.defaultValue || "false",
      },
    ],
    action_id: field.id,
  },
  label: {
    type: "plain_text",
    text: field.placeholder || field.name,
    emoji: true,
  },
});

// Helper function to safely extract field values
export const extractFieldValue = (value: unknown): string | PlainTextOption | PlainTextOption[] | undefined => {
  if (!value) return undefined;

  // Handle array of objects with name property
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    if (typeof value[0] === "object" && value[0] && "name" in value[0] && "id" in value[0]) {
      return convertToSlackOptions(value);
    }
    if (typeof value === "object" && value && "display_name" in value[0] && "id" in value[0]) {
      return value.map((val) =>
        convertToSlackOption({
          id: val.id as string,
          name: val.display_name as string,
        })
      );
    }
    return value; // Assume it's already string[]
  }

  // Handle single object with name property
  if (typeof value === "object" && value && "name" in value && "id" in value) {
    return convertToSlackOption({
      id: value.id as string,
      name: value.name as string,
    });
  }

  // Handle direct string
  if (typeof value === "string") {
    return value;
  }

  return undefined;
};
