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

// plane imports
import type { TLogoProps } from "../common";
import type { CompleteOrEmpty } from "../utils";

export enum ETemplateType {
  PROJECT = "project",
  WORK_ITEM = "workitem",
  PAGE = "page",
}

export type TTemplateCategory = {
  id: string;
  name: string;
  description: string | undefined;
  logo_props: CompleteOrEmpty<TLogoProps>;
  is_active: boolean;
  // timestamp
  created_at: string;
  updated_at: string;
};

export type TTemplateAttachment = {
  id: string;
  template_id: string;
  file_asset_id: string;
};

export type TBaseTemplate<T extends ETemplateType, D extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  name: string;
  short_description: string | undefined;
  template_type: T;
  template_data: D;
  // publish
  is_published: boolean;
  description_html: string | undefined;
  categories: string[];
  keywords: string[];
  company_name: string | undefined;
  contact_email: string | undefined;
  privacy_policy_url: string | undefined;
  terms_of_service_url: string | undefined;
  cover_image_asset: string | undefined;
  cover_image_url: string | undefined;
  attachments: string[];
  attachments_urls: string[];
  website: string | undefined;
  // workspace
  workspace: string;
  // project
  project: string | undefined;
  // timestamp
  created_at: string;
  updated_at: string;
  // user
  created_by: string | undefined;
  updated_by: string | undefined;
};

export type TBaseTemplateWithData = TBaseTemplate<ETemplateType, Record<string, unknown>>;

export type TPublishTemplateForm<T extends ETemplateType, D extends Record<string, unknown>> = Pick<
  TBaseTemplate<T, D>,
  | "id"
  | "name"
  | "short_description"
  | "description_html"
  | "categories"
  | "company_name"
  | "contact_email"
  | "keywords"
  | "privacy_policy_url"
  | "terms_of_service_url"
  | "cover_image_asset"
  | "cover_image_url"
  | "attachments"
  | "attachments_urls"
  | "website"
>;

export type TPublishTemplateFormWithData = TPublishTemplateForm<ETemplateType, Record<string, unknown>>;
