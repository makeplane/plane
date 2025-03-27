import concat from "lodash/concat";
import orderBy from "lodash/orderBy";
import remove from "lodash/remove";
import set from "lodash/set";
import uniq from "lodash/uniq";
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
  TCustomerWorkItemFilters,
  TCustomerWorkItemFilter,
} from "@plane/types";
// store
import { convertToEpoch } from "@plane/utils";
import { RootStore } from "@/plane-web/store/root.store";
import { EWorkspaceFeatureLoader, EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { RequestAttachmentStore } from "./attachment.store";

export interface ICustomersStore {
  attachment: RequestAttachmentStore;
  // observables
  loader: TLoader;
  isAnyModalOpen: boolean;
  customersMap: Record<string, TCustomer>;
  requestsMap: Record<string, TCustomerRequest>;
  customerRequestIdsMap: Record<string, string[]>;
  customerWorkItemIdsMap: Record<string, string[]>;
  customerIds: string[];
  customerSearchQuery: string;
  customerRequestSearchQuery: string;
  workItemRequestSearchQuery: string;
  attachmentDeleteModalId: string | null;
  paginationOptions: TCustomerPaginationOptions;
  isCustomersFeatureEnabled: boolean | undefined;
  customerDetailSidebarCollapsed: boolean | undefined;
  workItemRequestIdsMap: Record<string, string[]>;
  customerWorkItemFilters: TCustomerWorkItemFilters;
  requestDeleteModalId: string | null;
  requestSourceModalId: string | null;
  createUpdateRequestModalId: string | null;
  workItemCustomerIds: Record<string, string[]>;
  // helper actions
  updateSearchQuery: (query: string) => void;
  updateCustomerRequestSearchQuery: (query: string) => void;
  updateWorkItemRequestSearchQuery: (query: string) => void;
  toggleDeleteAttachmentModal: (requestId: string | null) => void;
  toggleCustomerDetailSidebar: (collapsed?: boolean) => void;
  updateCustomerWorkItemFilters: (filter: TCustomerWorkItemFilter, value: string) => void;
  toggleDeleteRequestModal: (requestId: string | null) => void;
  toggleCreateUpdateRequestModal: (id: string | null) => void;
  toggleRequestSourceModal: (requestId: string | null) => void;
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
  getFilteredWorkItemRequestIds: (workItemId: string) => string[];
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
  deleteCustomerRequest: (
    workspaceSlug: string,
    customerId: string,
    requestId: string,
    workItemId?: string
  ) => Promise<void>;
  getRequestById: (requestId: string) => TCustomerRequest | undefined;
  fetchCustomerWorkItems: (workspaceSlug: string, customerId: string) => Promise<void>;
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
  fetchWorkItemCustomers: (workspaceSlug: string, workItemId: string) => Promise<string[]>;
  fetchWorkItemRequests: (workspaceSlug: string, workItemId: string) => Promise<TCustomerRequest[]>;
  getWorkItemRequestIds: (workItemId: string) => string[];
  getWorkItemCustomerIds: (workItemId: string) => string[];
}

export class CustomerStore implements ICustomersStore {
  // observables
  loader: TLoader = undefined;
  isDeleteModalOpen: boolean = false;
  customersMap: Record<string, TCustomer> = {};
  customerIds: string[] = [];
  customerSearchQuery: string = "";
  customerRequestSearchQuery: string = "";
  workItemRequestSearchQuery: string = "";
  customerRequestIdsMap: Record<string, string[]> = {};
  customerWorkItemIdsMap: Record<string, string[]> = {};
  workItemRequestIdsMap: Record<string, string[]> = {};
  requestsMap: Record<string, TCustomerRequest> = {};
  attachmentDeleteModalId: string | null = null;
  requestDeleteModalId: string | null = null;
  paginationOptions: TCustomerPaginationOptions = { pageSize: 100, pageNo: 0, hasNextPage: false };
  customerDetailSidebarCollapsed: boolean | undefined = undefined;
  customerWorkItemFilters: TCustomerWorkItemFilters = {};
  createUpdateRequestModalId: string | null = null;
  requestSourceModalId: string | null = null;
  workItemCustomerIds: Record<string, string[]> = {};
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
      isDeleteModalOpen: observable.ref,
      customerSearchQuery: observable.ref,
      paginationOptions: observable.ref,
      customerRequestSearchQuery: observable.ref,
      workItemRequestSearchQuery: observable.ref,
      attachmentDeleteModalId: observable.ref,
      requestDeleteModalId: observable.ref,
      customersMap: observable,
      customerIds: observable,
      customerRequestIdsMap: observable,
      requestsMap: observable,
      customerWorkItemIdsMap: observable,
      customerDetailSidebarCollapsed: observable.ref,
      customerWorkItemFilters: observable,
      workItemRequestIdsMap: observable,
      createUpdateRequestModalId: observable.ref,
      requestSourceModalId: observable.ref,
      workItemCustomerIds: observable,
      // computed
      isCustomersFeatureEnabled: computed,
      isAnyModalOpen: computed,
      // helper actions
      updateSearchQuery: action,
      updateCustomerRequestSearchQuery: action,
      updateWorkItemRequestSearchQuery: action,
      toggleDeleteAttachmentModal: action,
      toggleCustomerDetailSidebar: action,
      updateCustomerWorkItemFilters: action,
      toggleDeleteRequestModal: action,
      toggleCreateUpdateRequestModal: action,
      toggleRequestSourceModal: action,
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
      fetchWorkItemCustomers: action,
      fetchWorkItemRequests: action,
      getWorkItemRequestIds: action,
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
        if (request.attachment_count)
          attachmentPromises.push(this.attachment.fetchAttachments(workspaceSlug, request.id));
        set(this.requestsMap, [request.id], request);
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
      // add request to the request map
      set(this.requestsMap, [response.id], { ...response });
      if (this.customerRequestIdsMap[customerId]) {
        this.customerRequestIdsMap[customerId].unshift(response.id);
      } else {
        this.customerRequestIdsMap[customerId] = [response.id];
      }
      // update request count for the customer
      update(this.customersMap, [customerId], (customer: TCustomer) => ({
        ...customer,
        customer_request_count: customer.customer_request_count + 1,
      }));
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
    const requestData = this.requestsMap[requestId];
    try {
      runInAction(() => {
        update(this.requestsMap, [requestId], (request: TCustomerRequest) => ({
          ...request,
          ...data,
        }));
      });
      const response = await this.customerRequestService.update(workspaceSlug, customerId, requestId, data);
      return response;
    } catch (error) {
      runInAction(() => {
        update(this.requestsMap, [requestId], (request: TCustomerRequest) => ({
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
  getRequestById = computedFn((requestId: string) => this.requestsMap[requestId]);

  /**
   * @description Get all the request ids for a customer
   * @param customerId
   */
  getFilteredCustomerRequestIds = computedFn((customerId: string): string[] => {
    const search = this.customerRequestSearchQuery;

    if (!this.customerRequestIdsMap[customerId]) return [];
    if (search === "") return this.customerRequestIdsMap[customerId];

    const filteredRequests = this.customerRequestIdsMap[customerId]
      .map((requestId) => this.getRequestById(requestId))
      .filter(Boolean)
      .filter((request) => request.name.toLocaleLowerCase().includes(this.customerRequestSearchQuery));
    return orderBy(filteredRequests, (e) => convertToEpoch(e.created_at), ["desc"]).map((e) => e.id);
  });

  /**
   * @description Get filtered the request ids for a customer
   * @param workItemId
   */
  getFilteredWorkItemRequestIds = computedFn((workItemId: string): string[] => {
    const search = this.workItemRequestSearchQuery;

    if (!this.workItemRequestIdsMap[workItemId]) return [];
    if (search === "") return this.workItemRequestIdsMap[workItemId];

    const filteredRequests = this.workItemRequestIdsMap[workItemId]
      .map((requestId) => this.getRequestById(requestId))
      .filter(Boolean)
      .filter((request) => request.name.toLocaleLowerCase().includes(this.workItemRequestSearchQuery));
    return filteredRequests.map((request) => request.id);
  });

  /**
   * @description Get customer work items
   * @param customerId
   */
  getCustomerWorkItemIds = computedFn((customerId: string): string[] | undefined =>
    this.customerWorkItemIdsMap[customerId] ? uniq(this.customerWorkItemIdsMap[customerId]) : undefined
  );

  /**
   * Delete a customer request
   * @param workspaceSlug
   * @param customerId
   * @param requestId
   */
  deleteCustomerRequest = async (
    workspaceSlug: string,
    customerId: string,
    requestId: string,
    workItemId?: string
  ): Promise<void> => {
    const request = this.getRequestById(requestId);
    const _workItemIds = request.work_item_ids || workItemId ? [workItemId] : [];
    await this.customerRequestService.destroy(workspaceSlug, customerId, requestId);
    runInAction(() => {
      delete this.requestsMap[requestId];
      remove(this.customerRequestIdsMap[customerId], (id) => id === requestId);
      // update counts
      update(this.customersMap, [customerId], (customer: TCustomer) => ({
        ...customer,
        customer_request_count: customer.customer_request_count - 1,
      }));
      // fetch updated customer work items if work item is deleted
      if (_workItemIds.length) {
        this.fetchCustomerWorkItems(workspaceSlug, customerId);
      }
      if (workItemId) {
        // remove request form the work item
        remove(this.workItemRequestIdsMap[workItemId], (id) => id === requestId);
        // update counts for work item
        update(this.rootStore.issue.issues.issuesMap, [workItemId], (issue: TIssue) => ({
          ...issue,
          customer_request_count: issue.customer_request_count ? issue.customer_request_count - 1 : 0,
        }));
      }
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
      const _workItems: TCustomerWorkItem[] = response.map((item) => ({ ...item, customer_request_id: requestId }));
      runInAction(() => {
        // update request data if work item is added to the request
        if (requestId) {
          update(this.requestsMap, [requestId], (request: TCustomerRequest) => ({
            ...request,
            work_item_ids: [...workItemIds, ...(request.work_item_ids || [])],
          }));
        }
        // update counts and data for work items
        _workItems.forEach((item) => {
          if (requestId) {
            if (this.workItemRequestIdsMap[item.id]) {
              // add request id to the work item
              concat(requestId, this.workItemRequestIdsMap[item.id]);
              // update counts for work items
              update(this.rootStore.issue.issues.issuesMap, [item.id], (issue: TIssue) => ({
                ...issue,
                customer_request_count: (issue.customer_request_count || 0) + 1,
              }));
            }
          }
          if (this.workItemCustomerIds[item.id]) {
            update(this.workItemCustomerIds, [item.id], (ids: string[]) => uniq([...ids, customerId]));
          } else set(this.workItemCustomerIds, [item.id], [customerId]);
        });
        if (this.customerWorkItemIdsMap[customerId]) {
          update(this.customerWorkItemIdsMap, [customerId], (ids: string[]) => [...workItemIds, ...ids]);
        } else set(this.customerWorkItemIdsMap, [customerId], workItemIds);

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
          const _workItemIds = this.requestsMap[_requestId]?.work_item_ids;
          remove(_workItemIds, (id) => id === workItemId);
          update(this.requestsMap, [_requestId], (request: TCustomerRequest) => ({
            ...request,
            issue_ids: _workItemIds,
          }));
        }
        remove(this.customerWorkItemIdsMap[customerId], (id) => id === workItemId);
        remove(this.workItemRequestIdsMap[workItemId], (id) => id === _requestId);
        // update count for work item if request is removed
        update(this.rootStore.issue.issues.issuesMap, [workItemId], (issue: TIssue) => ({
          ...issue,
          customer_request_count: issue.customer_request_count ? issue.customer_request_count - 1 : 0,
        }));
      });
      remove(this.workItemCustomerIds[workItemId], (id) => id === customerId);
    } catch (error) {
      console.error("CustomerStore->removeWorkItemFromCustomer", error);
      throw error;
    }
  };

  /**
   * Fetch customers list
   * @param workspaceSlug
   * @param workItemId
   * @returns
   */
  fetchWorkItemCustomers = async (workspaceSlug: string, workItemId: string): Promise<string[]> => {
    try {
      const response = await this.customerService.getWorkItemCustomers(workspaceSlug, workItemId);
      runInAction(() => {
        set(this.workItemCustomerIds, [workItemId], response);
      });
      return response;
    } catch (error) {
      console.error("CustomerStore", error);
      throw error;
    }
  };

  /**
   * Fetch all requests related to a customers
   * @param workspaceSlug
   * @param workItemId
   * @returns
   */
  fetchWorkItemRequests = async (workspaceSlug: string, workItemId: string): Promise<TCustomerRequest[]> => {
    try {
      const response = await this.customerRequestService.listWorkItemRequests(workspaceSlug, workItemId);
      runInAction(async () => {
        const _requestIds: string[] = [];
        const attachmentPromises: Promise<TCustomerRequestAttachment[]>[] = [];
        if (response.length) {
          response.forEach((request) => {
            _requestIds.push(request.id);
            if (this.requestsMap[request.id]) {
              update(this.requestsMap, [request.id], (data) => ({ ...data, ...request }));
            } else set(this.requestsMap, [request.id], request);

            if (request.attachment_count)
              attachmentPromises.push(this.attachment.fetchAttachments(workspaceSlug, request.id));
          });
          set(this.workItemRequestIdsMap, [workItemId], uniq(_requestIds));
          await Promise.all(attachmentPromises);
        }
      });
      return response;
    } catch (error) {
      console.error("CustomerStore", error);
      throw error;
    }
  };

  /**
   * @description Get work item customer ids
   * @param workItemId
   */
  getWorkItemCustomerIds = computedFn((workItemId: string): string[] => {
    const customerIds = this.workItemCustomerIds[workItemId] ?? [];
    return uniq(customerIds);
  });

  getWorkItemRequestIds = (workItemId: string): string[] => {
    const requestIds = this.workItemRequestIdsMap[workItemId] ?? [];
    return requestIds;
  };

  // helper actions
  updateSearchQuery = action((query: string) => (this.customerSearchQuery = query));

  updateCustomerRequestSearchQuery = action((query: string) => (this.customerRequestSearchQuery = query));

  updateWorkItemRequestSearchQuery = action((query: string) => (this.workItemRequestSearchQuery = query));

  toggleDeleteAttachmentModal = (attachmentId: string | null) => (this.attachmentDeleteModalId = attachmentId);

  toggleCustomerDetailSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.customerDetailSidebarCollapsed = !this.customerDetailSidebarCollapsed;
    } else {
      this.customerDetailSidebarCollapsed = collapsed;
    }
    localStorage.setItem("customer_detail_sidebar_collapsed", this.customerDetailSidebarCollapsed.toString());
  };

  updateCustomerWorkItemFilters = (filter: TCustomerWorkItemFilter, value: string) => {
    set(this.customerWorkItemFilters, [filter], value);
  };

  toggleDeleteRequestModal = (requestId: string | null) => (this.requestDeleteModalId = requestId);

  get isAnyModalOpen() {
    return (
      this.isDeleteModalOpen ||
      !!this.attachmentDeleteModalId ||
      !!this.requestDeleteModalId ||
      !!this.requestSourceModalId ||
      !!this.createUpdateRequestModalId
    );
  }

  toggleCreateUpdateRequestModal = (id: string | null) => (this.createUpdateRequestModalId = id);

  toggleRequestSourceModal = (requestId: string | null) => (this.requestSourceModalId = requestId);
}
