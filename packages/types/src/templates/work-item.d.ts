// plane imports
import { EIssuePropertyType, ETemplateType } from "@plane/constants";
import {
  TBaseTemplate,
  TIssue,
  TIssueType,
  IState,
  IIssueLabel,
  IUserLite,
  IModule,
  ISearchIssueResponse,
  TIssueProperty,
  TIssuePropertyOption,
  CompleteOrEmpty,
} from "@plane/types";

export type TWorkItemTypeSchema = Pick<TIssueType, "id" | "name" | "logo_props" | "is_epic">;

export type TWorkItemParentSchema = Pick<Partial<ISearchIssueResponse>, "id" | "project_id"> &
  Partial<{
    project_identifier: string | undefined;
    sequence_id: number | undefined;
    type: CompleteOrEmpty<TWorkItemTypeSchema>;
  }>;

export type TWorkItemStateSchema = Pick<Partial<IState>, "id" | "name" | "group">;

export type TWorkItemAssigneeSchema = Pick<IUserLite, "id">;

export type TWorkItemLabelSchema = Pick<IIssueLabel, "id" | "name">;

export type TWorkItemModuleSchema = Pick<IModule, "id" | "name">;

export type TCustomPropertyOptionSchema = Pick<TIssuePropertyOption, "id" | "name" | "is_default">;

export type TCustomPropertySchema = Pick<
  TIssueProperty<EIssuePropertyType>,
  | "id"
  | "name"
  | "display_name"
  | "property_type"
  | "relation_type"
  | "logo_props"
  | "is_required"
  | "settings"
  | "is_multi"
  | "default_value"
> & {
  options: TCustomPropertyOptionSchema[];
  values: string[];
};

export type TWorkItemPropertySchema = TCustomPropertySchema & { type: TWorkItemTypeSchema };

export type TWorkItemTemplateData = Pick<TIssue, "name" | "description_html" | "priority"> & {
  id?: string;
  parent: CompleteOrEmpty<TWorkItemParentSchema>;
  state: CompleteOrEmpty<TWorkItemStateSchema>;
  assignees: TWorkItemAssigneeSchema[];
  labels: TWorkItemLabelSchema[];
  type: CompleteOrEmpty<TWorkItemTypeSchema>;
  modules: TWorkItemModuleSchema[];
  properties: TWorkItemPropertySchema[];
  workspace: string;
  project: string | null;
};

export type TWorkItemTemplate = TBaseTemplate<ETemplateType.WORK_ITEM, TWorkItemTemplateData>;

export type TWorkItemTemplateFormData = Pick<
  TIssue,
  | "project_id"
  | "type_id"
  | "name"
  | "description_html"
  | "state_id"
  | "priority"
  | "assignee_ids"
  | "label_ids"
  | "module_ids"
  | "parent_id"
>;

export type TWorkItemTemplateForm = {
  template: Pick<TBaseTemplate, "id" | "name" | "description_html">;
  work_item: TWorkItemTemplateFormData;
};
