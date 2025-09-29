import { remove, orderBy, uniq, update, set } from "lodash-es";
import { makeObservable, observable, action, runInAction, computed } from "mobx";
// plane imports
import { computedFn } from "mobx-utils";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { CustomerRequestsService, CustomerService } from "@plane/services";
import {
  TCustomer,
  TCustomerRequest,
  TLoader,
  TCustomerRequestCreateResponse,
  TCustomerRequestAttachment,
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
import { WorkItemCustomersStore } from "./work-item-customers.store";

export interface ICustomersStore {
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
  attachmentDeleteModalId: string | null;
  paginationOptions: TCustomerPaginationOptions;
  isCustomersFeatureEnabled: boolean | undefined;
  customerDetailSidebarCollapsed: boolean | undefined;
  customerWorkItemFilters: TCustomerWorkItemFilters;
  requestDeleteModalId: string | null;
  requestSourceModalId: string | null;
  createUpdateRequestModalId: string | null;
  // helper actions
  updateSearchQuery: (query: string) => void;
  updateCustomerRequestSearchQuery: (query: string) => void;
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
  // stores
  attachment: RequestAttachmentStore;
  workItems: WorkItemCustomersStore;
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
  workItems: WorkItemCustomersStore;

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
      deleteCustomer: action,
      createCustomerRequest: action,
      deleteCustomerRequest: action,
    });

    // store
    this.rootStore = _rootStore;
    this.attachment = new RequestAttachmentStore(this);
    this.workItems = new WorkItemCustomersStore(this, this.rootStore);

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
  getRequestById = computedFn((requestId: string): TCustomerRequest | undefined => this.requestsMap[requestId]);

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
      .filter((request): request is TCustomerRequest => request !== undefined)
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
      .filter((request): request is TCustomerRequest => request !== undefined)
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
    const _workItemIds = request?.work_item_ids || workItemId ? [workItemId] : [];
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
        const _workItem = this.rootStore.issue.issues.getIssueById(workItemId);
        const _workItemCustomerRequestIds = _workItem?.customer_request_ids || [];
        this.rootStore.issue.issues.updateIssue(workItemId, {
          customer_request_ids: _workItemCustomerRequestIds.filter((id) => id !== requestId),
        });
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

  // helper actions
  updateSearchQuery = action((query: string) => (this.customerSearchQuery = query));

  updateCustomerRequestSearchQuery = action((query: string) => (this.customerRequestSearchQuery = query));

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
