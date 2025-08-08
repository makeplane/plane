import { FieldPath, FieldValues } from "react-hook-form";
// plane imports
import {
  EWorkItemTypeEntity,
  IIssueLabel,
  IIssueType,
  IModule,
  IState,
  IUserLite,
  TWorkItemBlueprintFormData,
} from "@plane/types";
import { TProjectBlueprintDetails, TWorkItemSanitizationResult } from "@plane/utils";

export type TWorkItemBlueprintWithAdditionalPropsData = {
  getLabelById: (labelId: string) => IIssueLabel | null;
  getModuleById: (moduleId: string) => IModule | null;
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getUserDetails: (userId: string) => IUserLite | undefined;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  getWorkItemTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>;
  areCustomPropertiesInitializing?: boolean;
  arePropertyValuesInitializing?: boolean;
  isWorkItemTypeEntityEnabled: (workspaceSlug: string, projectId: string, entityType: EWorkItemTypeEntity) => boolean;
  isWorkItemTypeInitializing?: boolean;
  labelIds: string[];
  memberIds: string[];
  moduleIds: string[];
  stateIds: string[];
  usePropsForAdditionalData: true;
};

export type TWorkItemBlueprintWithMobxData = {
  usePropsForAdditionalData: false;
};

export type TWorkItemBlueprintPropertiesBaseProps<T extends FieldValues> = {
  allowLabelCreation?: boolean;
  createLabel?: (data: Partial<IIssueLabel>) => Promise<IIssueLabel>;
  allowProjectSelection?: boolean;
  fieldPaths: {
    projectId: FieldPath<T>;
    issueTypeId: FieldPath<T>;
    name: FieldPath<T>;
    description: FieldPath<T>;
    state: FieldPath<T>;
    priority: FieldPath<T>;
    assigneeIds: FieldPath<T>;
    labelIds: FieldPath<T>;
    moduleIds: FieldPath<T>;
  };
  getProjectById: (projectId: string | undefined | null) => TProjectBlueprintDetails | undefined;
  handleInvalidIdsChange: <K extends keyof TWorkItemBlueprintFormData>(
    key: K,
    invalidIds: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"][K]
  ) => void;
  handleProjectChange?: (projectId: string) => void;
  invalidIds?: TWorkItemSanitizationResult<TWorkItemBlueprintFormData>["invalid"];
  projectId: string | null | undefined;
  projectIds?: string[];
  workspaceSlug: string;
  inputBorderVariant?: "primary" | "true-transparent";
  inputTextSize?: "md" | "lg";
  shouldLoadDefaultValues?: boolean;
};

export type TWorkItemBlueprintPropertiesWithMobxProps<T extends FieldValues> = TWorkItemBlueprintPropertiesBaseProps<T> &
  TWorkItemBlueprintWithMobxData;

export type TWorkItemBlueprintPropertiesWithAdditionalPropsProps<T extends FieldValues> =
  TWorkItemBlueprintPropertiesBaseProps<T> & TWorkItemBlueprintWithAdditionalPropsData;
