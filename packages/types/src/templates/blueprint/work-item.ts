// local imports
import { EIssuePropertyType, TIssueProperty } from "../../work-item-types/work-item-properties";
import { IIssueLabel } from "../../issues";
import { IState } from "../../state";
import { IUserLite } from "../../users";
import { CompleteOrEmpty } from "../../utils";
import { TIssuePropertyOption, TIssueType } from "../../work-item-types";
import { IModule } from "../../module";
import { TIssue } from "../../issues/issue";

export type TWorkItemTypeBlueprint = Pick<TIssueType, "id" | "name" | "description" | "logo_props" | "is_epic">;

export type TWorkItemStateBlueprint = Pick<Partial<IState>, "id" | "name" | "group">;

type TWorkItemAssigneeBlueprint = Pick<IUserLite, "id">;

export type TWorkItemLabelBlueprint = Pick<IIssueLabel, "id" | "name" | "color">;

type TWorkItemModuleBlueprint = Pick<IModule, "id" | "name">;

type TCustomPropertyOptionBlueprint = Pick<
  TIssuePropertyOption,
  "id" | "name" | "is_active" | "is_default" | "logo_props"
>;

export type TCustomPropertyBlueprint = Pick<
  TIssueProperty<EIssuePropertyType>,
  | "id"
  | "name"
  | "issue_type"
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
  options: TCustomPropertyOptionBlueprint[];
};

export type TCustomPropertyWithValuesBlueprint = TCustomPropertyBlueprint & {
  values: string[];
};

export type TWorkItemPropertyBlueprint = TCustomPropertyWithValuesBlueprint & { type: TWorkItemTypeBlueprint };

export type TWorkItemBlueprint = Pick<TIssue, "name" | "description_html" | "priority"> & {
  id?: string;
  state: CompleteOrEmpty<TWorkItemStateBlueprint>;
  assignees: TWorkItemAssigneeBlueprint[];
  labels: TWorkItemLabelBlueprint[];
  type: CompleteOrEmpty<TWorkItemTypeBlueprint>;
  modules: TWorkItemModuleBlueprint[];
  properties: TWorkItemPropertyBlueprint[];
  workspace: string;
  project: string | null;
};

export type TWorkItemBlueprintFormData = Pick<
  TIssue,
  | "id"
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
