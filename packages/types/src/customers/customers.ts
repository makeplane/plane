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

import type { TPaginationInfo } from "../common";
import type { TFileSignedURLResponse } from "../file";
import type { TIssue } from "../issues/issue";

export type TCustomerContractStatus = "active" | "pre_contract" | "signed" | "inactive";

export type TCustomerStage = "lead" | "sales_qualified_lead" | "contract_negotiation" | "closed_won" | "closed_lost";
export type TCustomerLogoProps = {
  title?: string;
  favicon?: string;
  favicon_url?: string;
  url?: string;
  error?: string;
};

export type TCustomer = {
  id: string | undefined;
  name: string;
  logo_url: string;
  logo_props: TCustomerLogoProps;
  description: object | undefined;
  description_html: string | undefined;
  description_stripped: string | undefined;
  description_binary: string | undefined;
  email: string;
  website_url: string | undefined;
  domain: string | undefined;
  employees: number | undefined;
  stage: TCustomerStage | undefined;
  contract_status: TCustomerContractStatus | undefined;
  revenue: number | undefined;
  customer_request_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TCustomerPayload = TCustomer & {
  logo_asset: string | undefined;
};

export type TCreateUpdateCustomerModal = {
  isOpen: boolean;
  customerId: string | undefined;
};

export type TCustomerPaginatedInfo = TPaginationInfo & {
  results: TCustomer[];
};

export type TCustomerRequest = {
  id: string;
  name: string;
  description: string | undefined;
  description_html: string | undefined;
  attachment_count: number;
  link: string | undefined;
  work_item_ids: string[];
  customer_id: string | undefined;
  created_at: string;
  created_by: string | undefined;
};

export type TCustomerRequestCreateResponse = TCustomerRequest & {
  issues: TIssue[];
};

export type TCustomerRequestAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset_url: string;
  issue_id: string;
  updated_at: string;
  updated_by: string;
  created_by: string;
};

export type TRequestAttachmentUploadResponse = TFileSignedURLResponse & {
  attachment: TCustomerRequestAttachment;
};

export type TCustomerRequestAttachmentMap = {
  [request_id: string]: TCustomerRequestAttachment;
};

export type TCustomerRequestAttachmentIdMap = {
  [request_id: string]: string[];
};

export type TCustomerWorkItem = TIssue & {
  customer_request_id?: string;
};

export type TCustomerListQuery = {
  query?: string;
  cursor?: string;
};

export type TCustomerPaginationOptions = {
  pageSize: number;
  pageNo: number;
  hasNextPage: boolean;
};

export type TAttachmentUploadPayload = {
  attachment_ids: string[];
};

export type TCustomerWorkItemFilters = {
  assignees?: string[] | null;
  priority?: string[] | null;
  state?: string[] | null;
};

export type TCustomerWorkItemFilter = keyof TCustomerWorkItemFilters;
