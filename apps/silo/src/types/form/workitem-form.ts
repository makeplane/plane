import { FormFieldsMetadata } from "./base";

export interface CreateWorkItemFormFieldsMetadata extends FormFieldsMetadata {
  slug: string;
  projectId: string;
  issueTypeId?: string;
}
