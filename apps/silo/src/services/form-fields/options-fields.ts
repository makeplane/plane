/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { PlaneClient, WorkItemProperty } from "@makeplane/plane-node-sdk";
import { getPlaneClientV2 } from "@/helpers/plane-api-client-v2";
import type { FormField, RelationField, SelectField } from "@/types/form/base/fields";

export class OptionFormFieldsService {
  private planeAPIClient: PlaneClient;

  constructor(accessToken: string) {
    this.planeAPIClient = getPlaneClientV2({ accessToken });
  }

  async getCustomFieldsForIssueType(
    slug: string,
    projectId: string,
    issueTypeId: string,
    orderInFormFields: number
  ): Promise<FormField[]> {
    const workItemProperties = await this.planeAPIClient.workItemProperties.list(slug, projectId, issueTypeId);

    const customFields: FormField[] = [];

    for (const property of workItemProperties) {
      const formField = this.getFormFieldFromProperty(issueTypeId, property);
      if (formField) {
        formField.order = orderInFormFields;
        orderInFormFields++;
        customFields.push(formField);
      }
    }

    return customFields;
  }

  private getFormFieldFromProperty(issueTypeId: string, property: WorkItemProperty): FormField | undefined {
    if (property.settings?.display_format === "readonly") {
      return undefined;
    }

    const isMulti = property.is_multi || property.settings?.display_format === "multi-line";

    // Create base field properties
    const baseField = {
      id: `${issueTypeId}:${property.id}`,
      name: property.display_name ?? "",
      type: property.property_type,
      required: property.is_required ?? false,
      visible: property.is_active ?? true,
      order: property.sort_order ?? 0,
      placeholder: property.description ?? "",
      helpText: property.description?.slice(0, 100) ?? "",
      customField: true,
      isMulti,
    };

    if (property.property_type === "RELATION") {
      const relationField = baseField as RelationField;
      relationField.relationType = property.relation_type ?? "USER";
      relationField.options = [];
      return relationField as FormField;
    }

    if (property.property_type === "OPTION") {
      const selectField = baseField as SelectField;
      selectField.options = [];
      return selectField;
    }

    return baseField as FormField;
  }
}
