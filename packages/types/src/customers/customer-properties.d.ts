import { EIssuePropertyType } from "@plane/constants";
import { TIssueProperty, TIssuePropertyOptionsPayload } from "../work-item-types";

export type TCustomerPropertiesOptions = {
  customerProperties: TIssueProperty<EIssuePropertyType>[];
  customerPropertyOptions: TIssuePropertyOptionsPayload;
};
