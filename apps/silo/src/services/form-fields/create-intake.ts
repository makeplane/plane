import { FormField } from "@/types/form/base/fields";
import { CreateIntakeFormFieldsMetadata } from "@/types/form/intake-form";
import { StaticFormFieldsService } from "./static-fields";

export const getCreateIntakeFormFields = async (
  slug: string,
  projectId: string
): Promise<CreateIntakeFormFieldsMetadata> => {
  const staticFieldsService = new StaticFormFieldsService();

  const titleField = staticFieldsService.getTitleField(1);
  const descriptionField = staticFieldsService.getDescriptionField(2);
  const priorityField = staticFieldsService.getPriorityField(3);

  const fields: FormField[] = [titleField, descriptionField, priorityField];

  return {
    slug,
    fields,
    projectId,
  };
};
