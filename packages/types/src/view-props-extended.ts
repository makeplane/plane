export interface IExtendedIssueDisplayProperties {
  customer_request_count?: boolean;
  customer_count?: boolean;
}

export type TExtendedIssueOrderByOptions =
  | "customer_request_count"
  | "-customer_request_count"
  | "customer_count"
  | "-customer_count";

export const WORK_ITEM_FILTER_PROPERTY_KEYS_EXTENDED = ["team_project_id", "type_id"] as const;
