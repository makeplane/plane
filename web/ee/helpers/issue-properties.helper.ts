// plane web constants
import {
  DROPDOWN_ATTRIBUTES,
  getDateAttributeDisplayName,
  getTextAttributeDisplayName,
  ISSUE_PROPERTY_TYPE_DETAILS,
} from "@/plane-web/constants/issue-properties";
// plane web types
import { IIssueProperty } from "@/plane-web/store/issue-types";
import {
  EIssuePropertyRelationType,
  EIssuePropertyType,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TIssuePropertyTypeDetails,
  TIssuePropertyTypeKeys,
  TIssuePropertyValues,
  TTextAttributeDisplayOptions,
} from "@/plane-web/types";

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
    multiSelectAttributes?.find((attribute) => attribute.key === "single_select")?.label ?? "Single select";
  const multiSelectLabel =
    multiSelectAttributes?.find((attribute) => attribute.key === "multi_select")?.label ?? "Multi select";
  return is_multi !== undefined ? (is_multi ? multiSelectLabel : singleSelectLabel) : "No default value";
};

// Get the display name for the boolean attribute based on the default value
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getBooleanAttributeDisplayName = (default_value: string | undefined) => "True | False";
// default_value !== undefined ? `${default_value === "true" ? "True" : "False"}` : "True | False";

// Get the display name for the issue property attribute based on the property type
export const getIssuePropertyAttributeDisplayName = (
  issuePropertyDetail: Partial<TIssueProperty<EIssuePropertyType>> | undefined
) => {
  const propertyTypeKey = getIssuePropertyTypeKey(
    issuePropertyDetail?.property_type,
    issuePropertyDetail?.relation_type
  );
  switch (propertyTypeKey) {
    case "TEXT":
      return getTextAttributeDisplayName(issuePropertyDetail?.settings?.display_format as TTextAttributeDisplayOptions);
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