// plane imports
import { PROJECT_UNSPLASH_COVERS, RANDOM_EMOJI_CODES } from "@plane/constants";
import { PartialDeep, TProjectTemplateForm } from "@plane/types";
// local imports
import { mockCreateDefaultProjectStates } from "./state";
import {
  mockCreateDefaultWorkItemTypeInstance,
  mockCreateProjectEpicWorkItemTypeInstance,
  TMockCreateDefaultWorkItemTypeInstanceParams,
} from "./work-item-type";

type TGenerateAdditionalProjectTemplateFormDataParams = TMockCreateDefaultWorkItemTypeInstanceParams;

/**
 * Generate additional project template form data that are dynamic
 * @param params
 * @param params.workspaceSlug - The workspace slug
 * @param params.projectId - The project id
 * @param params.createWorkItemTypeInstance - The function to create the work item type instance
 * @param params.createOptionInstance - The function to create the option instance
 * @param params.getWorkItemTypeById - The function to get the work item type by id
 * @param params.getCustomPropertyById - The function to get the custom property by id
 * @returns The additional project template form data - PartialDeep<TProjectTemplateForm>
 */
export const generateAdditionalProjectTemplateFormData = async (
  params: TGenerateAdditionalProjectTemplateFormDataParams
): Promise<PartialDeep<TProjectTemplateForm>> => {
  const projectStates = await mockCreateDefaultProjectStates(params);
  const defaultWorkItemType = await mockCreateDefaultWorkItemTypeInstance(params);
  const workItemTypes = defaultWorkItemType.id ? { [defaultWorkItemType.id]: defaultWorkItemType } : {};
  const projectEpicWorkItemType = await mockCreateProjectEpicWorkItemTypeInstance(params);

  return {
    project: {
      logo_props: {
        in_use: "emoji",
        emoji: {
          value: RANDOM_EMOJI_CODES[Math.floor(Math.random() * RANDOM_EMOJI_CODES.length)],
        },
      },
      cover_image_url: PROJECT_UNSPLASH_COVERS[Math.floor(Math.random() * PROJECT_UNSPLASH_COVERS.length)],
      states: projectStates,
      workitem_types: workItemTypes,
      epics: projectEpicWorkItemType,
    },
  };
};
