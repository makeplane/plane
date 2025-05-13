import { IIssueDisplayProperties, TIssueOrderByOptions } from "@plane/types";

export const ISSUE_ADDITIONAL_DISPLAY_PROPERTIES_KEYS: (keyof IIssueDisplayProperties)[] = [
  "customer_request_count",
  "customer_count",
];

export const ISSUE_ADDITIONAL_DISPLAY_PROPERTIES: {
  key: keyof IIssueDisplayProperties;
  titleTranslationKey: string;
}[] = [
  { key: "customer_request_count", titleTranslationKey: "issue.display.properties.customer_request_count" },
  { key: "customer_count", titleTranslationKey: "issue.display.properties.customer_count" },
];

export const ADDITIONAL_SPREADSHEET_PROPERTY_LIST: (keyof IIssueDisplayProperties)[] = [
  "customer_request_count",
  "customer_count",
];

export const ADDITIONAL_SPREADSHEET_PROPERTY_DETAILS: {
  [key in keyof IIssueDisplayProperties]: {
    i18n_title: string;
    ascendingOrderKey: TIssueOrderByOptions;
    ascendingOrderTitle: string;
    descendingOrderKey: TIssueOrderByOptions;
    descendingOrderTitle: string;
    icon: string;
  };
} = {
  customer_request_count: {
    i18n_title: "issue.display.properties.requests",
    ascendingOrderKey: "-customer_request_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "customer_request_count",
    descendingOrderTitle: "Least",
    icon: "CustomerRequestIcon",
  },
  customer_count: {
    i18n_title: "issue.display.properties.customer",
    ascendingOrderKey: "-customer_count",
    ascendingOrderTitle: "Most",
    descendingOrderKey: "customer_count",
    descendingOrderTitle: "Least",
    icon: "CustomersIcon",
  },
};
