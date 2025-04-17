import { createContext } from "react";
// plane imports
import { TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";

export type TCreateUpdatePropertyValuesProps = {
  customerId: string;
  workspaceSlug: string;
};

export type TCustomerModalContext = {
  customerPropertyValues: TIssuePropertyValues;
  setCustomerPropertyValues: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
  customerPropertyValueErrors: TIssuePropertyValueErrors;
  setCustomerPropertyValueErrors: React.Dispatch<React.SetStateAction<TIssuePropertyValueErrors>>;
  handlePropertyValuesValidation: () => boolean;
  handleCreateUpdatePropertyValues: (props: TCreateUpdatePropertyValuesProps) => Promise<void>;
};

export const CustomerModalContext = createContext<TCustomerModalContext | undefined>(undefined);
