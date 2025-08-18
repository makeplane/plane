import { TIssuePropertyValues, TWorkItemTemplate, TWorkItemTemplateForm } from "@plane/types";
// local imports
import { buildWorkItemBlueprint, TBuildWorkItemBlueprintBaseParams } from "./blueprint/build";

/**
 * Parameters for building work item template blueprint
 */
export type TBuildWorkItemTemplateBlueprintBaseParams = {
  subWorkItemListCustomPropertyValues: Record<string, TIssuePropertyValues>;
} & TBuildWorkItemBlueprintBaseParams;

/**
 * Parameters for building work item template data blueprint
 */
type TBuildWorkItemTemplateBlueprintParams = {
  workItem: TWorkItemTemplateForm["work_item"];
} & TBuildWorkItemTemplateBlueprintBaseParams;

/**
 * Builds the work item template data blueprint
 * @param params - The parameters for building the work item template data blueprint
 * @param params.workItem - The work item form data blueprint
 * @param params.customPropertyValues - The custom property values
 * @param params.subWorkItemListCustomPropertyValues - The work item list custom property values
 * @param params.rest - The rest of the parameters
 * @returns The work item template data blueprint
 */
export const buildWorkItemTemplateBlueprint = (
  params: TBuildWorkItemTemplateBlueprintParams
): TWorkItemTemplate["template_data"] => {
  const { workItem, customPropertyValues, subWorkItemListCustomPropertyValues, ...rest } = params;

  return {
    ...buildWorkItemBlueprint({
      ...rest,
      workItem,
      customPropertyValues,
    }),
    sub_workitems: workItem.sub_workitems.map((subWorkItem) =>
      buildWorkItemBlueprint({
        ...rest,
        workItem: subWorkItem,
        customPropertyValues: subWorkItemListCustomPropertyValues[subWorkItem.id],
      })
    ),
  };
};
