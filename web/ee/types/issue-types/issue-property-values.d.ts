// property value variant
export type TPropertyValueVariant = "create" | "update";

export type TIssuePropertyValues = {
  [property_id: string]: string[];
};

const IssuePropertyValueError = {
  REQUIRED: "REQUIRED",
  INVALID: "INVALID",
} as const;

export type EIssuePropertyValueError = keyof typeof IssuePropertyValueError;

export type TIssuePropertyValueErrors = {
  [property_id: string]: EIssuePropertyValueError;
};
