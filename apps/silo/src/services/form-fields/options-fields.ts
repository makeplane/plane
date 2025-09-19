import { IssuePropertyAPI, PropertyTypeEnum, RelationTypeEnum } from "@makeplane/plane-node-sdk";
import { getPlaneClientV2, PlaneClientV2 } from "@/helpers/plane-api-client-v2";
import { FormField, RelationField, SelectField } from "@/types/form/base/fields";

export class OptionFormFieldsService {
  private planeAPIClient: PlaneClientV2;

  constructor(accessToken: string) {
    this.planeAPIClient = getPlaneClientV2({ accessToken });
  }

  async getCustomFieldsForIssueType(
    slug: string,
    projectId: string,
    issueTypeId: string,
    orderInFormFields: number
  ): Promise<FormField[]> {
    const workItemProperties = await this.planeAPIClient.workItemPropertiesApi.listIssueProperties({
      projectId,
      slug,
      typeId: issueTypeId,
    });

    const customFields: FormField[] = [];

    for (const property of workItemProperties) {
      const formField = await this.getFormFieldFromProperty(issueTypeId, property);
      if (formField) {
        formField.order = orderInFormFields;
        orderInFormFields++;
        customFields.push(formField);
      }
    }

    return customFields;
  }

  private async getFormFieldFromProperty(
    issueTypeId: string,
    property: IssuePropertyAPI
  ): Promise<FormField | undefined> {
    if (property.settings?.display_format === "readonly") {
      return undefined;
    }

    const isMulti = property.isMulti || property.settings?.display_format === "multi-line";

    // Create base field properties
    const baseField = {
      id: `${issueTypeId}:${property.id}`,
      name: property.displayName ?? "",
      type: property.propertyType as PropertyTypeEnum,
      required: property.isRequired ?? false,
      visible: property.isActive ?? true,
      order: property.sortOrder ?? 0,
      placeholder: property.description ?? "",
      helpText: property.description?.slice(0, 100) ?? "",
      customField: true,
      isMulti,
    };

    if (property.propertyType === "RELATION") {
      const relationField = baseField as RelationField;
      relationField.relationType = property.relationType ?? RelationTypeEnum.User;
      relationField.options = [];
      return relationField as FormField;
    }

    if (property.propertyType === "OPTION") {
      const selectField = baseField as SelectField;
      selectField.options = [];
      return selectField;
    }

    return baseField as FormField;
  }
}
