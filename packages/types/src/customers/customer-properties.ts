import { TIssueProperty, TIssuePropertyOptionsPayload } from "../work-item-types";
import { EIssuePropertyType } from "../work-item-types/work-item-properties";

export type TCustomerPropertiesOptions = {
  customerProperties: TIssueProperty<EIssuePropertyType>[];
  customerPropertyOptions: TIssuePropertyOptionsPayload;
};
