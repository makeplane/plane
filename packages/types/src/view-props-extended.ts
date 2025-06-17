export interface IExtendedIssueDisplayProperties {
  customer_request_count?: boolean;
  customer_count?: boolean;
}

export type TExtendedIssueOrderByOptions =
  | "customer_request_count"
  | "-customer_request_count"
  | "customer_count"
  | "-customer_count";
