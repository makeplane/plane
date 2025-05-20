// types
import { TLogoProps } from "@plane/types";

// Issue property dropdown options
export type TIssuePropertyOption = {
  id: string | undefined;
  name: string | undefined;
  sort_order: number | undefined;
  property: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  is_active: boolean | undefined;
  parent: string | undefined;
  is_default: boolean | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
};

// Issue property option store
export interface IIssuePropertyOption extends TIssuePropertyOption {
  // computed
  asJSON: TIssuePropertyOption;
  // helper action
  updateOptionData: (propertyOptionData: Partial<TIssuePropertyOption>) => void;
}

// Issue property options payload
export type TIssuePropertyOptionsPayload = {
  [propertyId: string]: TIssuePropertyOption[];
};

// Issue property option create list
export type TIssuePropertyOptionCreateUpdateData = Partial<TIssuePropertyOption> & {
  key?: string;
};
