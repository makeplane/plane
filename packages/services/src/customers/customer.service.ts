import { API_BASE_URL } from "@plane/constants";
import {
  ISearchIssueResponse,
  TCustomer,
  TCustomerListQuery,
  TCustomerPaginatedInfo,
  TCustomerPayload,
  TCustomerWorkItem,
  TIssue,
  TProjectIssuesSearchParams,
} from "@plane/types";
// services
import { APIService } from "../api.service";

export class CustomerService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all customers
   * @param workspaceSlug
   * @returns Promise<TCustomer[]>
   */
  async list(workspaceSlug: string, query?: TCustomerListQuery): Promise<TCustomerPaginatedInfo> {
    return this.get(`/api/workspaces/${workspaceSlug}/customers/`, {
      params: query,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a customer
   * @param workspaceSlug
   * @param data
   * @returns Promise<TCustomer>
   */
  async create(workspaceSlug: string, data: Partial<TCustomerPayload>): Promise<TCustomer> {
    return this.post(`/api/workspaces/${workspaceSlug}/customers/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get customer details
   * @param workspaceSlug
   * @param customerId
   * @returns Promise<TCustomer>
   */
  async retrieve(workspaceSlug: string, customerId: string): Promise<TCustomer> {
    return this.get(`/api/workspaces/${workspaceSlug}/customers/${customerId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a customer
   * @param workspaceSlug
   * @param data
   * @param customerId
   * @returns Promise<TCustomer>
   */
  async update(workspaceSlug: string, customerId: string, data: Partial<TCustomerPayload>): Promise<TCustomer> {
    return this.patch(`/api/workspaces/${workspaceSlug}/customers/${customerId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a customer
   * @param workspaceSlug
   * @param data
   * @param customerId
   */
  async destroy(workspaceSlug: string, customerId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/customers/${customerId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Work items/ Epics search
   * @param workspaceSlug
   * @param customerId
   * @param params
   */
  async workItemsSearch(
    workspaceSlug: string,
    customerId: string,
    params: TProjectIssuesSearchParams
  ): Promise<ISearchIssueResponse[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/customers/${customerId}/search-work-items/`, {
      params: { search: params.search, customer_request_id: params.customer_request_id },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Fetches all customers work items
   * @param workspaceSlug
   * @param customerId
   * @param query
   * @returns Promise<TCustomer[]>
   */
  async listWorkItems(
    workspaceSlug: string,
    customerId: string,
    query?: { request_id: string }
  ): Promise<TCustomerWorkItem[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/customers/${customerId}/work-items/`, { params: query })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Adding work item to customer / request
   * @param workspaceSlug
   * @param customerId
   * @param workItemIds
   * @param query
   * @returns Promise<TIssue[]>
   */
  async addWorkItemToCustomer(
    workspaceSlug: string,
    customerId: string,
    workItemIds: string[],
    query?: { customer_request_id: string }
  ): Promise<TIssue[]> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/customers/${customerId}/work-items/`,
      { issue_ids: workItemIds },
      {
        params: query,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Removing work items from  customer/request
   * @param workspaceSlug
   * @param customerId
   * @param workItemId
   * @param query
   * @returns Promise<TIssue[]>
   */
  async removeWorkItemFromCustomer(
    workspaceSlug: string,
    customerId: string,
    workItemId: string,
    query?: { customer_request_id: string }
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/customers/${customerId}/work-items/${workItemId}/`, null, {
      params: query,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Get list of work items related to a customer
   * @param workspaceSlug
   * @param workItemId
   * @returns
   */
  async getWorkItemCustomers(workspaceSlug: string, workItemId: string): Promise<string[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-items/${workItemId}/customers/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
