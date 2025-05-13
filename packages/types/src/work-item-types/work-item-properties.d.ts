import { EIssuePropertyRelationType, EIssuePropertyType } from "@plane/constants";
import { TLogoProps, TIssuePropertyOption, TIssuePropertySettingsMap, IIssuePropertyOption } from "@plane/types";

// Base issue property type
type TBaseIssueProperty = {
  id: string | undefined;
  name: string | undefined;
  display_name: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  sort_order: number | undefined;
  relation_type: EIssuePropertyRelationType | null | undefined;
  is_required: boolean | undefined;
  default_value: string[] | undefined;
  is_active: boolean | undefined;
  issue_type: string | undefined;
  is_multi: boolean | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
};

// Issue property type
export interface TIssueProperty<T extends EIssuePropertyType> extends TBaseIssueProperty {
  property_type: T | undefined;
  settings: TIssuePropertySettingsMap[T] | undefined;
}

// Issue property store
export interface IIssueProperty<T extends EIssuePropertyType> extends TIssueProperty<T> {
  propertyOptions: IIssuePropertyOption[];
  // computed
  asJSON: TIssueProperty<T>;
  sortedActivePropertyOptions: TIssuePropertyOption[];
  // computed function
  getPropertyOptionById: (propertyOptionId: string) => IIssuePropertyOption | undefined;
  // helper actions
  updatePropertyData: (propertyData: TIssueProperty<EIssuePropertyType>) => void;
  addOrUpdatePropertyOptions: (propertyOptionsData: TIssuePropertyOption[]) => void;
  // actions
  updateProperty: (issueTypeId: string, propertyData: TIssuePropertyPayload) => Promise<void>;
  createPropertyOption: (propertyOption: Partial<TIssuePropertyOption>) => Promise<TIssuePropertyOption | undefined>;
  deletePropertyOption: (propertyOptionId: string) => Promise<void>;
}

// Issue property payload
export type TIssuePropertyPayload = Partial<TIssueProperty<EIssuePropertyType>> & {
  options: Partial<TIssuePropertyOption>[];
};

// Issue property response
export type TIssuePropertyResponse = TIssueProperty<EIssuePropertyType> & {
  options: TIssuePropertyOption[];
};
