// local imports
import { ETemplateType, TBaseTemplate } from "./base";
import { TWorkItemBlueprint, TWorkItemBlueprintFormData } from "./blueprint/work-item";

export type TWorkItemTemplateData = TWorkItemBlueprint & {
  sub_workitems: TWorkItemBlueprint[];
};

export type TWorkItemTemplate = TBaseTemplate<ETemplateType.WORK_ITEM, TWorkItemTemplateData>;

export type TWorkItemTemplateFormData = TWorkItemBlueprintFormData & {
  sub_workitems: TWorkItemBlueprintFormData[];
};

export type TWorkItemTemplateForm = {
  template: Pick<TWorkItemTemplate, "id" | "name" | "short_description">;
  work_item: TWorkItemTemplateFormData;
};
