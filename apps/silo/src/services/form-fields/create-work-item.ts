import { FormField } from "@/types/form/base/fields";
import { CreateWorkItemFormFieldsMetadata } from "@/types/form/workitem-form";
import { OptionFormFieldsService } from "./options-fields";
import { StaticFormFieldsService } from "./static-fields";

export const getCreateWorkItemFormFields = async (
  slug: string,
  projectId: string,
  accessToken: string,
  issueTypeId?: string
): Promise<CreateWorkItemFormFieldsMetadata> => {
  const staticFieldsService = new StaticFormFieldsService();
  const optionFieldsService = new OptionFormFieldsService(accessToken);

  const titleField = staticFieldsService.getTitleField(1);
  const descriptionField = staticFieldsService.getDescriptionField(2);
  const priorityField = staticFieldsService.getPriorityField(3);
  const labelsField = staticFieldsService.getLabelsField(4);
  const stateField = staticFieldsService.getStatesField(5);
  const assigneesField = staticFieldsService.getAssigneesField(6);
  let customFields: FormField[] = [];
  if (issueTypeId) {
    customFields = await optionFieldsService.getCustomFieldsForIssueType(slug, projectId, issueTypeId, 6);
  }

  const fields: FormField[] = [
    titleField,
    descriptionField,
    priorityField,
    labelsField,
    stateField,
    assigneesField,
    ...customFields,
  ];

  return {
    slug,
    fields,
    projectId,
    issueTypeId,
  };
};
