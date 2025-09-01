import { TLogoProps, TPaginationInfo } from "../common";
import { TFileSignedURLResponse } from "../file";
import { TIssue } from "../issues/issue";

export type TCustomerContractStatus = "active" | "pre_contract" | "signed" | "inactive";

export type TCustomerStage = "lead" | "sales_qualified_lead" | "contract_negotiation" | "closed_won" | "closed_lost";
export type TCustomer = {
  id: string | undefined;
  name: string;
  logo_url: string;
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
