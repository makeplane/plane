import { createContext } from "react";
import { UseFormWatch } from "react-hook-form";
// plane imports
import { TIssue, TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";

export type TPropertyValuesValidationProps = {
  projectId: string | null;
  workspaceSlug: string;
  watch: UseFormWatch<TIssue>;
};

export type TActiveAdditionalPropertiesProps = {
  projectId: string | null;
  workspaceSlug: string;
  watch: UseFormWatch<TIssue>;
};

export type TCreateUpdatePropertyValuesProps = {
  issueId: string;
  projectId: string;
  workspaceSlug: string;
  issueTypeId: string | null | undefined;
  isDraft?: boolean;
};

export type TIssueModalContext = {
  issuePropertyValues: TIssuePropertyValues;
  setIssuePropertyValues: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
  issuePropertyValueErrors: TIssuePropertyValueErrors;
  setIssuePropertyValueErrors: React.Dispatch<React.SetStateAction<TIssuePropertyValueErrors>>;
  getIssueTypeIdOnProjectChange: (projectId: string) => string | null;
  getActiveAdditionalPropertiesLength: (props: TActiveAdditionalPropertiesProps) => number;
  handlePropertyValuesValidation: (props: TPropertyValuesValidationProps) => boolean;
  handleCreateUpdatePropertyValues: (props: TCreateUpdatePropertyValuesProps) => Promise<void>;
};

export const IssueModalContext = createContext<TIssueModalContext | undefined>(undefined);
