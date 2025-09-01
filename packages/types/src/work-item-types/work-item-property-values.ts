// property value variant
export type TPropertyValueVariant = "create" | "update";

export type TIssuePropertyValues = {
  [property_id: string]: string[];
};

export type IssuePropertyValueError = {
  REQUIRED: "REQUIRED";
  INVALID: "INVALID";
};

export type EIssuePropertyValueError = keyof IssuePropertyValueError;

export type TIssuePropertyValueErrors = {
  [property_id: string]: EIssuePropertyValueError;
};
