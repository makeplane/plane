import { API_BASE_URL } from "@plane/constants";
import { TBaseIssue, TCustomerRequestCreateResponse, TCustomerRequest } from "@plane/types";
// services
import { APIService } from "../api.service";
import { FileUploadService } from "../file/file-upload.service";

export class CustomerRequestsService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  /**
   * Fetches all customers
   * @param workspaceSlug
   * @returns Promise<TCustomerRequest[]>
   */
  async list(workspaceSlug: string, customerId: string): Promise<TCustomerRequest[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/customers/${customerId}/customer-requests/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Create a customer request
   * @param workspaceSlug
   * @param data
   * @returns Promise<TCustomerRequest>
   */
  async create(
    workspaceSlug: string,
    customerId: string,
    data: Partial<TCustomerRequest>
  ): Promise<TCustomerRequestCreateResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/customers/${customerId}/customer-requests/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get customer request details
   * @param workspaceSlug
   * @param customerId
   * @param requestId
   * @returns Promise<TCustomerRequest>
   */
  async retrieve(workspaceSlug: string, customerId: string, requestId: string): Promise<TCustomerRequest> {
    return this.get(`/api/workspaces/${workspaceSlug}/customers/${customerId}/customer-requests/${requestId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Update a customer request
   * @param workspaceSlug
   * @param data
   * @param customerId
   * @param
   * @returns Promise<TCustomerRequest>
   */
  async update(
    workspaceSlug: string,
    customerId: string,
    requestId: string,
    data: Partial<TCustomerRequest>
  ): Promise<TCustomerRequest> {
    return this.patch(`/api/workspaces/${workspaceSlug}/customers/${customerId}/customer-requests/${requestId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Add work item to a customer request
   * @param workspaceSlug
   * @param requestId
   * @param workItemIds
   */
  async addWorkItems(workspaceSlug: string, requestId: string, workItemIds: string[]): Promise<TBaseIssue[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/customer-requests/${requestId}/`, { work_item_ids: workItemIds })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Remove work item from a customer request
   * @param workspaceSlug
   * @param requestId
   * @param workItemId
   */
  async removeWorkItem(workspaceSlug: string, requestId: string, workItemId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/customer-requests/${requestId}/work-items/${workItemId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete a customer request
   * @param workspaceSlug
   * @param data
   * @param customerId
   * @param requestId
   */
  async destroy(workspaceSlug: string, customerId: string, requestId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/customers/${customerId}/customer-requests/${requestId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Get list of requests for a customer
   * @param workspaceSlug
   * @param workItemId
   * @returns
   */
  async listWorkItemRequests(workspaceSlug: string, workItemId: string): Promise<TCustomerRequest[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/work-items/${workItemId}/customer-requests/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
