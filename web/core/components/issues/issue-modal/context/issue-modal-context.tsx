import { createContext } from "react";
// ce imports
import { TIssueFields } from "ce/components/issues";
// react-hook-form
import { UseFormReset, UseFormWatch } from "react-hook-form";
// plane imports
import { EditorRefApi } from "@plane/editor";
import { ISearchIssueResponse, TIssue } from "@plane/types";
import { TIssuePropertyValues, TIssuePropertyValueErrors } from "@/plane-web/types/issue-types";

export type TPropertyValuesValidationProps = {
  projectId: string | null;
  workspaceSlug: string;
  watch: UseFormWatch<TIssueFields>;
};

export type TActiveAdditionalPropertiesProps = {
  projectId: string | null;
  workspaceSlug: string;
  watch: UseFormWatch<TIssueFields>;
};

export type TCreateUpdatePropertyValuesProps = {
  issueId: string;
  projectId: string;
  workspaceSlug: string;
  issueTypeId: string | null | undefined;
  isDraft?: boolean;
};

export type THandleTemplateChangeProps = {
  workspaceSlug: string;
  reset: UseFormReset<TIssue>;
  editorRef: React.MutableRefObject<EditorRefApi | null>;
};

export type THandleProjectEntitiesFetchProps = {
  workspaceSlug: string;
  templateId: string;
};

export type THandleParentWorkItemDetailsProps = {
  workspaceSlug: string;
  parentId: string | undefined;
  parentProjectId: string | undefined;
  isParentEpic: boolean;
};

export type TIssueModalContext = {
  workItemTemplateId: string | null;
  setWorkItemTemplateId: React.Dispatch<React.SetStateAction<string | null>>;
  isApplyingTemplate: boolean;
  setIsApplyingTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  selectedParentIssue: ISearchIssueResponse | null;
  setSelectedParentIssue: React.Dispatch<React.SetStateAction<ISearchIssueResponse | null>>;
  issuePropertyValues: TIssuePropertyValues;
  setIssuePropertyValues: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
  issuePropertyValueErrors: TIssuePropertyValueErrors;
  setIssuePropertyValueErrors: React.Dispatch<React.SetStateAction<TIssuePropertyValueErrors>>;
  getIssueTypeIdOnProjectChange: (projectId: string) => string | null;
  getActiveAdditionalPropertiesLength: (props: TActiveAdditionalPropertiesProps) => number;
  handlePropertyValuesValidation: (props: TPropertyValuesValidationProps) => boolean;
  handleCreateUpdatePropertyValues: (props: TCreateUpdatePropertyValuesProps) => Promise<void>;
  handleParentWorkItemDetails: (props: THandleParentWorkItemDetailsProps) => Promise<ISearchIssueResponse | undefined>;
  handleProjectEntitiesFetch: (props: THandleProjectEntitiesFetchProps) => Promise<void>;
  handleTemplateChange: (props: THandleTemplateChangeProps) => Promise<void>;
};

export const IssueModalContext = createContext<TIssueModalContext | undefined>(undefined);
