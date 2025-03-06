import remove from "lodash/remove";
import set from "lodash/set";
import update from "lodash/update";
import { makeObservable, observable, action, runInAction, computed } from "mobx";
// plane imports
import { computedFn } from "mobx-utils";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { CustomerRequestsService, CustomerService } from "@plane/services";
import {
  TCustomerWorkItem,
  TCustomer,
  TCustomerRequest,
  TLoader,
  TCustomerRequestCreateResponse,
  TCustomerRequestAttachment,
  TIssue,
  TCustomerPayload,
  TCustomerPaginationOptions,
  TCustomerListQuery,
} from "@plane/types";
// store
import { RootStore } from "@/plane-web/store/root.store";
import { EWorkspaceFeatureLoader, EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { RequestAttachmentStore } from "./attachment.store";

export interface ICustomersStore {
  attachment: RequestAttachmentStore;
  // observables
  loader: TLoader;
  customersMap: Record<string, TCustomer>;
  customerRequestsMap: Record<string, Record<string, TCustomerRequest>>;
  customerRequestIdsMap: Record<string, string[]>;
  customerWorkItemIdsMap: Record<string, string[]>;
  customerIds: string[];
  customerSearchQuery: string;
  requestSearchQuery: string;
  attachmentDeleteModalId: string | null;
  paginationOptions: TCustomerPaginationOptions;
  isCustomersFeatureEnabled: boolean | undefined;
  customerDetailSidebarCollapsed: boolean | undefined;
  // helper actions
  updateSearchQuery: (query: string) => void;
  updateRequestSearchQuery: (query: string) => void;
  // actions
  fetchCustomers: (workspaceSlug: string, search?: string) => Promise<void>;
  fetchNextCustomers: (workspaceSlug: string) => Promise<void>;
  fetchCustomerDetails: (workspaceSlug: string, customerId: string) => Promise<TCustomer>;
  createCustomer: (workspaceSlug: string, data: Partial<TCustomer>) => Promise<TCustomer>;
  updateCustomer: (workspaceSlug: string, customerId: string, data: Partial<TCustomer>) => Promise<TCustomer>;
  deleteCustomer: (workspaceSlug: string, customerId: string) => Promise<void>;
  getCustomerById: (customerId: string) => TCustomer | undefined;
  fetchCustomerRequests: (workspaceSlug: string, customerId: string) => Promise<TCustomerRequest[]>;
  getFilteredCustomerRequestIds: (customerId: string) => string[];
  getCustomerWorkItemIds: (customerId: string) => string[] | undefined;
  createCustomerRequest: (
    workspaceSlug: string,
    customerId: string,
    data: Partial<TCustomerRequest>
  ) => Promise<TCustomerRequest>;
  updateCustomerRequest: (
    workspaceSlug: string,
    customerId: string,
    requestId: string,
    data: Partial<TCustomerRequest>
  ) => Promise<TCustomerRequest>;
  deleteCustomerRequest: (workspaceSlug: string, customerId: string, requestId: string) => Promise<void>;
  getRequestById: (customerId: string, requestId: string) => TCustomerRequest | undefined;
  fetchCustomerWorkItems: (workspaceSlug: string, customerId: string) => Promise<void>;
  fetchWorkItems: (workspaceSlug: string, customerId: string, requestId: string) => Promise<TCustomerWorkItem[]>;
  addWorkItemsToCustomer: (
    workspacesSlug: string,
    customerId: string,
    workItemIds: string[],
    requestId?: string
  ) => Promise<TIssue[]>;
  removeWorkItemFromCustomer: (
    workspacesSlug: string,
    customerId: string,
    workItemId: string,
    requestId?: string
  ) => Promise<void>;
  toggleDeleteAttachmentModal: (requestId: string | null) => void;
  toggleCustomerDetailSidebar: (collapsed?: boolean) => void;
}

export class CustomerStore implements ICustomersStore {
  // observables
  loader: TLoader = undefined;
  customersMap: Record<string, TCustomer> = {};
  customerIds: string[] = [];
  customerSearchQuery: string = "";
  requestSearchQuery: string = "";
  customerRequestIdsMap: Record<string, string[]> = {};
  customerRequestsMap: Record<string, Record<string, TCustomerRequest>> = {};
  customerWorkItemIdsMap: Record<string, string[]> = {};
  attachmentDeleteModalId: string | null = null;
  paginationOptions: TCustomerPaginationOptions = { pageSize: 30, pageNo: 0, hasNextPage: false };
  customerDetailSidebarCollapsed: boolean | undefined = undefined;
  // services
  customerService: CustomerService;
  customerRequestService: CustomerRequestsService;
  // store
  rootStore: RootStore;
  attachment: RequestAttachmentStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      customerSearchQuery: observable.ref,
      paginationOptions: observable.ref,
      requestSearchQuery: observable.ref,
      attachmentDeleteModalId: observable.ref,
      customersMap: observable,
      customerIds: observable,
      customerRequestIdsMap: observable,
      customerRequestsMap: observable,
      customerWorkItemIdsMap: observable,
      customerDetailSidebarCollapsed: observable.ref,
      // computed
      isCustomersFeatureEnabled: computed,
      // helper actions
      updateSearchQuery: action,
      updateRequestSearchQuery: action,
      // actions
      fetchCustomers: action,
      fetchNextCustomers: action,
      fetchCustomerDetails: action,
      fetchCustomerWorkItems: action,
      createCustomer: action,
      updateCustomer: action,
      updateCustomerRequest: action,
      addWorkItemsToCustomer: action,
      removeWorkItemFromCustomer: action,
      deleteCustomer: action,
      createCustomerRequest: action,
      deleteCustomerRequest: action,
      toggleDeleteAttachmentModal: action,
      toggleCustomerDetailSidebar: action,
    });

    // store
    this.rootStore = _rootStore;
    this.attachment = new RequestAttachmentStore(this);

    // service
    this.customerService = new CustomerService();
    this.customerRequestService = new CustomerRequestsService();
  }

  /**
   * Returns whether the customers feature is enabled or not for the current workspace
   */
  get isCustomersFeatureEnabled() {
    const { loader, isWorkspaceFeatureEnabled } = this.rootStore.workspaceFeatures;
    const { getFeatureFlagForCurrentWorkspace } = this.rootStore.featureFlags;
    // handle workspace feature init loader
    if (loader === EWorkspaceFeatureLoader.INIT_LOADER) return undefined;
    return (
      isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_CUSTOMERS_ENABLED) &&
      getFeatureFlagForCurrentWorkspace(E_FEATURE_FLAGS.CUSTOMERS, false)
    );
  }

  /**
   * @description fetch all customers
   * @param workspaceSlug
   */
  fetchCustomers = async (workspaceSlug: string, search?: string): Promise<void> => {
    this.loader = "init-loader";

    try {
      const query: TCustomerListQuery = {
        query: search ?? this.customerSearchQuery,
        cursor: `${this.paginationOptions.pageSize}:${this.paginationOptions.pageNo}:0`,
      };
      const response = await this.customerService.list(workspaceSlug, query);
      const results = response.results;
      runInAction(() => {
        this.customerIds = [];
        this.customersMap = {};
        results.forEach((customer) => {
          if (customer.id) {
            if (!this.customerIds.includes(customer.id)) this.customerIds.push(customer.id);
            set(this.customersMap, [customer.id], customer);
          }
        });
        /** set pagination data */
        this.paginationOptions.hasNextPage = response.next_page_results;
      });
    } catch (error) {
      console.error("CustomerStore->fetchCustomers", error);
    } finally {
      this.loader = undefined;
    }
  };

  /**
   * @description Fetch paginated data
   * @param workspaceSlug
   */
  fetchNextCustomers = async (workspaceSlug: string): Promise<void> => {
    if (!this.paginationOptions.hasNextPage) return;
    try {
      this.loader = "pagination";
      // increment page number
      this.paginationOptions.pageNo += 1;
      const query: TCustomerListQuery = {
        query: this.customerSearchQuery,
        cursor: `${this.paginationOptions.pageSize}:${this.paginationOptions.pageNo}:0`,
      };
      const response = await this.customerService.list(workspaceSlug, query);
      const results = response.results;
      runInAction(() => {
        results.forEach((customer) => {
          if (customer.id) {
            if (!this.customerIds.includes(customer.id)) this.customerIds.push(customer.id);
            set(this.customersMap, [customer.id], customer);
          }
        });
        /** set pagination data */
        this.paginationOptions.hasNextPage = response.next_page_results;
      });
    } catch (error) {
      console.error("CustomerStore->fetchCustomers", error);
    } finally {
      this.loader = undefined;
    }
  };

  /**
   * @description create a customer
   * @param workspaceSlug
   */
  createCustomer = async (workspaceSlug: string, data: Partial<TCustomerPayload>): Promise<TCustomer> =>
    await this.customerService.create(workspaceSlug, data).then((response) => {
      runInAction(() => {
        if (response.id) {
          set(this.customersMap, [response.id], response);
          this.customerIds.unshift(response.id);
        }
      });

      return response;
    });

  /**
   * @description get customer details form server
   * @param workspaceSlug
   */
  fetchCustomerDetails = async (workspaceSlug: string, customerId: string): Promise<TCustomer> => {
    this.loader = "init-loader";
    try {
      const response = await this.customerService.retrieve(workspaceSlug, customerId);
      runInAction(() => {
        set(this.customersMap, [customerId], response);
      });
      await this.fetchCustomerRequests(workspaceSlug, customerId);
      await this.fetchCustomerWorkItems(workspaceSlug, customerId);
      this.loader = undefined;
      return response;
    } catch (error) {
      console.error("CustomersStore-> fetchCustomerDetails");
      this.loader = undefined;
      throw error;
    }
  };

  /**
   * @description get customer details by id
   */
  getCustomerById = computedFn((customerId: string) => this.customersMap[customerId]);

  /**
   * @description update customer
   * @param workspaceSlug
   * @param customerId
   * @param data TCustomer
   */
  updateCustomer = async (
    workspaceSlug: string,
    customerId: string,
    data: Partial<TCustomerPayload>
  ): Promise<TCustomer> => {
    const customerData = this.customersMap[customerId];
    try {
      runInAction(() => {
        update(this.customersMap, [customerId], (customer) => ({ ...customer, ...data }));
      });
      const response = await this.customerService.update(workspaceSlug, customerId, data);
      if (data.logo_asset) {
        runInAction(() => {
          update(this.customersMap, [customerId], (customer) => ({ ...customer, logo_url: response.logo_url }));
        });
      }
      return response;
    } catch (error) {
      runInAction(() => {
        update(this.customersMap, [customerId], () => ({ ...customerData }));
      });
      throw error;
    }
  };

  /**
   * @description delete a customer
   * @param workspaceSlug
   * @param customerId
   */
  deleteCustomer = async (workspaceSlug: string, customerId: string): Promise<void> => {
    this.loader = "mutation";
    await this.customerService.destroy(workspaceSlug, customerId).then(() => {
      runInAction(() => {
        remove(this.customerIds, (id) => id === customerId);
        delete this.customersMap[customerId];
      });
      this.loader = "loaded";
    });
  };

  /**
   * @description Fetch customer requests
   * @param workspaceSlug
   * @param customerId
   */
  fetchCustomerRequests = async (workspaceSlug: string, customerId: string): Promise<TCustomerRequest[]> => {
    const response = await this.customerRequestService.list(workspaceSlug, customerId);
    runInAction(async () => {
      const requestIds: string[] = [];
      const attachmentPromises: Promise<TCustomerRequestAttachment[]>[] = [];
      response.forEach((request) => {
        requestIds.push(request.id);
        attachmentPromises.push(this.attachment.fetchAttachments(workspaceSlug, request.id));
        set(this.customerRequestsMap, [customerId, request.id], request);
      });
      set(this.customerRequestIdsMap, [customerId], requestIds);
      await Promise.all(attachmentPromises);
    });
    return response;
  };

  /**
   * @description Create customer request
   * @param workspacesSlug
   * @param customerId
   * @param data TCustomerRequest
   */
  createCustomerRequest = async (
    workspaceSlug: string,
    customerId: string,
    data: Partial<TCustomerRequest>
  ): Promise<TCustomerRequestCreateResponse> => {
    const response = await this.customerRequestService.create(workspaceSlug, customerId, data);
    runInAction(() => {
      const _workItems = response.issues;
      const workItemIds = _workItems.map((item) => item.id);

      set(this.customerRequestsMap, [customerId, response.id], { ...response, issue_ids: workItemIds });
      if (this.customerRequestIdsMap[customerId]) {
        this.customerRequestIdsMap[customerId].unshift(response.id);
      } else {
        this.customerRequestIdsMap[customerId] = [response.id];
      }
      update(this.customersMap, [customerId], (customer: TCustomer) => ({
        ...customer,
        customer_request_count: customer.customer_request_count + 1,
      }));

      if (this.customerWorkItemIdsMap[customerId]) {
        update(this.customerWorkItemIdsMap, [customerId], (ids: string[]) => [...ids, ...workItemIds]);
      } else {
        set(this.customerRequestIdsMap, [customerId], workItemIds);
      }
      this.rootStore.issue.issues.addIssue(_workItems);
    });
    return response;
  };

  /**
   * Update customer request
   * @param workspaceSlug
   * @param customerId
   * @param data
   */
  updateCustomerRequest = async (
    workspaceSlug: string,
    customerId: string,
    requestId: string,
    data: Partial<TCustomerRequest>
  ): Promise<TCustomerRequest> => {
    const requestData = this.customerRequestsMap[requestId];
    try {
      runInAction(() => {
        update(this.customerRequestsMap, [customerId, requestId], (request: TCustomerRequest) => ({
          ...request,
          ...data,
        }));
      });
      const response = await this.customerRequestService.update(workspaceSlug, customerId, requestId, data);
      return response;
    } catch (error) {
      runInAction(() => {
        update(this.customerRequestsMap, [customerId, requestId], (request: TCustomerRequest) => ({
          ...request,
          ...requestData,
        }));
      });
      console.error(`CustomerStore->updateCustomerRequest`, error);
      throw error;
    }
  };

  /**
   * @description Get customer requests by id
   * @param customerId
   * @param requestId
   */
  getRequestById = computedFn(
    (customerId: string, requestId: string) => this.customerRequestsMap[customerId][requestId]
  );

  /**
   * @description Get all the request ids for a customer
   * @param customerId
   */
  getFilteredCustomerRequestIds = computedFn((customerId: string): string[] => {
    const search = this.requestSearchQuery;

    if (!this.customerRequestIdsMap[customerId]) return [];
    if (search === "") return this.customerRequestIdsMap[customerId];

    const filteredRequests = this.customerRequestIdsMap[customerId]
      .map((requestId) => this.getRequestById(customerId, requestId))
      .filter(Boolean)
      .filter((request) => request.name.toLocaleLowerCase().includes(this.requestSearchQuery));
    return filteredRequests.map((request) => request.id);
  });

  /**
   * @description Get customer work items
   * @param customerId
   */
  getCustomerWorkItemIds = computedFn(
    (customerId: string): string[] | undefined => this.customerWorkItemIdsMap[customerId]
  );

  /**
   * Delete a customer request
   * @param workspaceSlug
   * @param customerId
   * @param requestId
   */
  deleteCustomerRequest = async (workspaceSlug: string, customerId: string, requestId: string): Promise<void> => {
    const request = this.getRequestById(customerId, requestId);
    const _workItemIds = request.issue_ids || [];
    await this.customerRequestService.destroy(workspaceSlug, customerId, requestId);
    runInAction(() => {
      delete this.customerRequestsMap[customerId][requestId];
      remove(this.customerRequestIdsMap[customerId], (id) => id === requestId);
      update(this.customersMap, [customerId], (customer: TCustomer) => ({
        ...customer,
        customer_request_count: customer.customer_request_count - 1,
      }));
      remove(this.customerWorkItemIdsMap[customerId], (id) => _workItemIds.includes(id));
    });
  };

  /**
   * @param workspaceSlug
   * @param customerId
   */
  fetchCustomerWorkItems = async (workspaceSlug: string, customerId: string): Promise<void> => {
    try {
      const response = await this.customerService.listWorkItems(workspaceSlug, customerId);
      runInAction(() => {
        this.rootStore.issue.issues.addIssue(response);
        const _workItemIds = response.map((item) => item.id);
        set(this.customerWorkItemIdsMap, [customerId], _workItemIds);
      });
    } catch (error) {
      console.error("CustomerStore->fetchCustomerWorkItems", error);
      throw error;
    }
  };

  /**
   * Add work item to request
   * @param workspacesSlug
   * @param requestId
   * @param workItemIds
   */
  addWorkItemsToCustomer = async (
    workspacesSlug: string,
    customerId: string,
    workItemIds: string[],
    requestId?: string
  ): Promise<TCustomerWorkItem[]> => {
    try {
      const _params = requestId ? { customer_request_id: requestId } : undefined;
      const response = await this.customerService.addWorkItemToCustomer(
        workspacesSlug,
        customerId,
        workItemIds,
        _params
      );
      runInAction(() => {
        // update request data if work item is added to the request
        if (requestId) {
          update(this.customerRequestsMap, [customerId, requestId], (request: TCustomerRequest) => ({
            ...request,
            issue_ids: [...workItemIds, ...request.issue_ids],
          }));
        }
        if (this.customerWorkItemIdsMap[customerId]) {
          update(this.customerWorkItemIdsMap, [customerId], (ids: string[]) => [...workItemIds, ...ids]);
        } else set(this.customerWorkItemIdsMap, [customerId], workItemIds);

        const _workItems: TCustomerWorkItem[] = response.map((item) => ({ ...item, customer_request_id: requestId }));
        this.rootStore.issue.issues.addIssue(_workItems);
      });
      return response;
    } catch (error) {
      console.error("CustomerStore->addWorkItemsToRequest", error);
      throw error;
    }
  };

  /**
   * @description Remove work item from request
   * @param workspaceSlug
   * @param customerId
   * @param requestId
   * @param workItemId
   */
  removeWorkItemFromCustomer = async (
    workspaceSlug: string,
    customerId: string,
    workItemId: string,
    requestId?: string
  ): Promise<void> => {
    try {
      const _params = requestId ? { customer_request_id: requestId } : undefined;
      await this.customerService.removeWorkItemFromCustomer(workspaceSlug, customerId, workItemId, _params);
      const workItem: TCustomerWorkItem | undefined = this.rootStore.issue.issues.getIssueById(workItemId);
      const _requestId = workItem?.customer_request_id || requestId;
      runInAction(() => {
        if (_requestId) {
          const _workItemIds = this.customerRequestsMap[customerId][_requestId].issue_ids;
          remove(_workItemIds, (id) => id === workItemId);
          update(this.customerRequestsMap, [customerId, _requestId], (request: TCustomerRequest) => ({
            ...request,
            issue_ids: _workItemIds,
          }));
        }
        remove(this.customerWorkItemIdsMap[customerId], (id) => id === workItemId);
        this.rootStore.issue.issues.removeIssue(workItemId);
      });
    } catch (error) {
      console.error("CustomerStore->removeWorkItemFromCustomer", error);
      throw error;
    }
  };

  /**
   *
   * @param workspaceSlug
   * @param customerId
   * @param requestId
   */
  fetchWorkItems = async (
    workspaceSlug: string,
    customerId: string,
    requestId: string
  ): Promise<TCustomerWorkItem[]> => {
    try {
      const response = await this.customerService.listWorkItems(workspaceSlug, customerId, { request_id: requestId });
      return response;
    } catch (error) {
      console.error("CustomerStore", error);
      throw error;
    }
  };

  updateSearchQuery = action((query: string) => (this.customerSearchQuery = query));

  updateRequestSearchQuery = action((query: string) => (this.requestSearchQuery = query));

  toggleDeleteAttachmentModal = (attachmentId: string | null) => (this.attachmentDeleteModalId = attachmentId);

  toggleCustomerDetailSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.customerDetailSidebarCollapsed = !this.customerDetailSidebarCollapsed;
    } else {
      this.customerDetailSidebarCollapsed = collapsed;
    }
    localStorage.setItem("customer_detail_sidebar_collapsed", this.customerDetailSidebarCollapsed.toString());
  };
}
