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
  TIssueProperty,
  TIssuePropertyOption,
  CompleteOrEmpty,
} from "@plane/types";

export type TWorkItemTypeSchema = Pick<TIssueType, "id" | "name" | "description" | "logo_props" | "is_epic">;

export type TWorkItemStateSchema = Pick<Partial<IState>, "id" | "name" | "group">;

type TWorkItemAssigneeSchema = Pick<IUserLite, "id">;

export type TWorkItemLabelSchema = Pick<IIssueLabel, "id" | "name" | "color">;

type TWorkItemModuleSchema = Pick<IModule, "id" | "name">;

type TCustomPropertyOptionSchema = Pick<
  TIssuePropertyOption,
  "id" | "name" | "is_active" | "is_default" | "logo_props"
>;

export type TCustomPropertySchema = Pick<
  TIssueProperty<EIssuePropertyType>,
  | "id"
  | "name"
  | "display_name"
  | "description"
  | "property_type"
  | "relation_type"
  | "logo_props"
  | "is_required"
  | "settings"
  | "is_active"
  | "is_multi"
  | "default_value"
> & {
  options: TCustomPropertyOptionSchema[];
};

export type TCustomPropertyWithValuesSchema = TCustomPropertySchema & {
  values: string[];
};

export type TWorkItemPropertySchema = TCustomPropertyWithValuesSchema & { type: TWorkItemTypeSchema };

export type TWorkItemTemplateData = Pick<TIssue, "name" | "description_html" | "priority"> & {
  id?: string;
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
>;

export type TWorkItemTemplateForm = {
  template: Pick<TWorkItemTemplate, "id" | "name" | "short_description">;
  work_item: TWorkItemTemplateFormData;
};
