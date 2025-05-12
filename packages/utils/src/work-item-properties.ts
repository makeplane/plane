// plane imports
import {
  EIssuePropertyRelationType,
  EIssuePropertyType,
  DROPDOWN_ATTRIBUTES,
  ISSUE_PROPERTY_TYPE_DETAILS,
} from "@plane/constants";
import {
  IIssueProperty,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TIssuePropertyTypeDetails,
  TIssuePropertyTypeKeys,
  TIssuePropertyValues,
  TTextAttributeDisplayOptions,
} from "@plane/types";
// local imports
import { renderFormattedDate } from "./datetime";

// Get the display name for the text attribute based on the display format
export const getTextAttributeDisplayNameKey = (display_format: TTextAttributeDisplayOptions) => {
  switch (display_format) {
    case "single-line":
      return "work_item_types.settings.properties.attributes.text.single_line.label";
    case "multi-line":
      return "work_item_types.settings.properties.attributes.text.multi_line.label";
    case "readonly":
      return "work_item_types.settings.properties.attributes.text.readonly.label";
    default:
      return "work_item_types.settings.properties.attributes.text.invalid_text_format.label";
  }
};

// Get the display name for the date attribute based on the display format
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getDateAttributeDisplayName = (display_format: TDateAttributeDisplayOptions) =>
  renderFormattedDate(new Date()) ?? "Invalid date format";
// TODO: enable this in next phase of issue types
// switch (display_format) {
//   case "MMM dd, yyyy":
//     return "mmm. dd. yyyy";
//   case "dd/MM/yyyy":
//     return "dd. mm. yyyy";
//   case "MM/dd/yyyy":
//     return "mm. dd. yyyy";
//   case "yyyy/MM/dd":
//     return "yyyy. mm. dd";
//   default:
//     return "Invalid date format";
// }

// Get the key for the issue property type based on the property type and relation type
export const getIssuePropertyTypeKey = (
  issuePropertyType: EIssuePropertyType | undefined,
  issuePropertyRelationType: EIssuePropertyRelationType | null | undefined
) =>
  `${issuePropertyType}${issuePropertyRelationType ? `_${issuePropertyRelationType}` : ""}` as TIssuePropertyTypeKeys;

// Get the display name for the issue property type based on the property type and relation type
export const getIssuePropertyTypeDetails = (
  issuePropertyType: EIssuePropertyType | undefined,
  issuePropertyRelationType: EIssuePropertyRelationType | null | undefined
): TIssuePropertyTypeDetails<EIssuePropertyType> | undefined => {
  const propertyTypeKey = getIssuePropertyTypeKey(issuePropertyType, issuePropertyRelationType);
  return ISSUE_PROPERTY_TYPE_DETAILS[propertyTypeKey];
};

// Get the display name for the number attribute based on the default value
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getNumberAttributeDisplayName = (default_value: string | undefined) => undefined;

// Get the display name for multi select attribute based on the is_multi property
export const getMultiSelectAttributeDisplayName = (
  is_multi: boolean | undefined,
  variant: TIssuePropertyTypeKeys = "RELATION_USER"
) => {
  const multiSelectAttributes = DROPDOWN_ATTRIBUTES[variant];
  const singleSelectLabel =
    multiSelectAttributes?.find((attribute) => attribute.key === "single_select")?.i18n_label ??
    "work_item_types.settings.properties.attributes.relation.single_select.label";
  const multiSelectLabel =
    multiSelectAttributes?.find((attribute) => attribute.key === "multi_select")?.i18n_label ??
    "work_item_types.settings.properties.attributes.relation.multi_select.label";
  return is_multi !== undefined
    ? is_multi
      ? multiSelectLabel
      : singleSelectLabel
    : "work_item_types.settings.properties.attributes.relation.no_default_value.label";
};

// Get the display name for the boolean attribute based on the default value
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getBooleanAttributeDisplayName = (default_value: string | undefined) =>
  "work_item_types.settings.properties.attributes.boolean.label";
// default_value !== undefined ? `${default_value === "true" ? "True" : "False"}` : "True | False";

// Get the display name for the issue property attribute based on the property type
export const getIssuePropertyAttributeDisplayNameKey = (
  issuePropertyDetail: Partial<TIssueProperty<EIssuePropertyType>> | undefined
) => {
  const propertyTypeKey = getIssuePropertyTypeKey(
    issuePropertyDetail?.property_type,
    issuePropertyDetail?.relation_type
  );
  switch (propertyTypeKey) {
    case "TEXT":
      return getTextAttributeDisplayNameKey(
        issuePropertyDetail?.settings?.display_format as TTextAttributeDisplayOptions
      );
    case "DECIMAL":
      return getNumberAttributeDisplayName(issuePropertyDetail?.default_value?.[0]);
    case "DATETIME":
      return getDateAttributeDisplayName(issuePropertyDetail?.settings?.display_format as TDateAttributeDisplayOptions);
    case "OPTION":
      return getMultiSelectAttributeDisplayName(issuePropertyDetail?.is_multi, "OPTION");
    case "BOOLEAN":
      return getBooleanAttributeDisplayName(issuePropertyDetail?.default_value?.[0]);
    case "RELATION_USER":
      return getMultiSelectAttributeDisplayName(issuePropertyDetail?.is_multi, "RELATION_USER");
    default:
      return "";
  }
};

// helper function to get the default value for every property
export const getPropertiesDefaultValues = (properties: IIssueProperty<EIssuePropertyType>[]): TIssuePropertyValues => {
  const defaultValues: TIssuePropertyValues = {};
  properties?.forEach((property) => {
    if (property.id && property.default_value) defaultValues[property.id] = property.default_value ?? [];
  });
  return defaultValues;
};
