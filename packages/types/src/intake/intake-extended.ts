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

import type { TLogoProps } from "../common";
import type { TProjectDetails } from "../publish";
import type { TIssueProperty, TIssuePropertyOption, EIssuePropertyType } from "../work-item-types";
import type { TIssuePropertySerializedEntry } from "../work-item-types/work-item-types-extended";

export type TIntakeTypeForm = {
  id: string;
  name: string;
  work_item_type: string;
  form_fields: string[];
  is_active?: boolean;
  description?: string;
  anchor?: string;
  is_workitem_name_required?: boolean;
  is_workitem_description_required?: boolean;
};

export type TIntakeFormSettingsResponse = Omit<TIntakeTypeForm, "form_fields"> & {
  intake: string;
  created_at: string;
  updated_at: string;
  form_fields: Array<TIssueProperty<EIssuePropertyType> & { options: TIssuePropertyOption[] }>;
  project_details?: TProjectDetails;
  workspace: string;
};

export type TIntakeFormSubmitPayload = {
  username: string;
  email: string;
  name: string;
  description_html: string;
  values: Record<string, string | string[] | boolean>;
  attachment_ids: string[];
};

export type TIntakeFormProperty = {
  property: TIssueProperty<EIssuePropertyType>;
  options?: TIssuePropertyOption[];
};

export type TIntakePublishFormProps = {
  // Preview mode flag
  isPreview?: boolean;

  // Project metadata
  projectName: string;
  projectLogo?: TLogoProps;
  projectCoverImage?: string;
  projectCoverImageFallback: string;

  // Form configuration
  formTitle: string;
  formDescription?: string;
  showDescription?: boolean;
  isTitleRequired?: boolean;
  isDescriptionRequired?: boolean;
  properties: TIntakeFormProperty[];

  // Form handlers
  isSubmitting?: boolean;
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;

  // Optional rich editor
  editorComponent?: React.ComponentType<any>;
  editorProps?: Record<string, any>;

  // File upload handler
  onFileUpload?: (files: File[]) => Promise<string[]> | void;

  className?: string;
};

export type TIntakeIssueExtended = {
  additional_information: TIssuePropertySerializedEntry[];
};
