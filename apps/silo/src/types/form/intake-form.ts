import { FormFieldsMetadata } from "./base";

export interface CreateIntakeFormFieldsMetadata extends FormFieldsMetadata {
  slug: string;
  projectId: string;
}
