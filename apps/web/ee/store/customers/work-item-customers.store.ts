import concat from "lodash/concat";
import remove from "lodash/remove";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { CustomerRequestsService, CustomerService } from "@plane/services";
import { TCustomerRequest, TCustomerRequestAttachment, TCustomerWorkItem, TIssue } from "@plane/types";
import { RootStore } from "../root.store";
import { ICustomersStore } from "./customers.store";

export interface IWorkItemCustomersStore {
  workItemRequestIdsMap: Record<string, string[]>;
  workItemRequestSearchQuery: string;
  workItemCustomerIds: Record<string, string[]>;
  // helper actions
  updateWorkItemRequestSearchQuery: (query: string) => void;
  getFilteredWorkItemRequestIds: (workItemId: string) => string[];
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
  getWorkItemCustomerIds: (workItemId: string) => string[];
  getCustomerCountByWorkItemId: (workItemId: string) => number;
}

export class WorkItemCustomersStore implements IWorkItemCustomersStore {
  // observables
  workItemRequestIdsMap: Record<string, string[]> = {};
  workItemRequestSearchQuery: string = "";
  workItemCustomerIds: Record<string, string[]> = {};

  // store
  customerStore: ICustomersStore;
  rootStore: RootStore;

  // services
  customerRequestService: CustomerRequestsService;
  customerService: CustomerService;

  constructor(_customerStore: ICustomersStore, _rootStore: RootStore) {
    makeObservable(this, {
      workItemRequestIdsMap: observable,
      workItemRequestSearchQuery: observable,
      workItemCustomerIds: observable,
      // actions
      updateWorkItemRequestSearchQuery: action,
      addWorkItemsToCustomer: action,
      removeWorkItemFromCustomer: action,
      fetchWorkItemCustomers: action,
      fetchWorkItemRequests: action,
    });
    // store
    this.customerStore = _customerStore;
    this.rootStore = _rootStore;
    // services
    this.customerRequestService = new CustomerRequestsService();
    this.customerService = new CustomerService();
  }

  // helpers
  updateWorkItemRequestSearchQuery = action((query: string) => (this.workItemRequestSearchQuery = query));

  /**
   * @description Get filtered the request ids for a customer
   * @param workItemId
   */
  getFilteredWorkItemRequestIds = computedFn((workItemId: string): string[] => {
    const search = this.workItemRequestSearchQuery;

    if (!this.workItemRequestIdsMap[workItemId]) return [];
    if (search === "") return this.workItemRequestIdsMap[workItemId];

    const filteredRequests = this.workItemRequestIdsMap[workItemId]
      .map((requestId) => this.customerStore.getRequestById(requestId))
      .filter((request): request is TCustomerRequest => !!request)
      .filter((request) => request.name.toLocaleLowerCase().includes(this.workItemRequestSearchQuery));
    return filteredRequests.map((request) => request.id);
  });

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
        if (response) {
          response.forEach((request) => {
            _requestIds.push(request.id);
            if (this.customerStore.requestsMap[request.id]) {
              update(this.customerStore.requestsMap, [request.id], (data) => ({ ...data, ...request }));
            } else set(this.customerStore.requestsMap, [request.id], request);

            if (request.attachment_count)
              attachmentPromises.push(this.customerStore.attachment.fetchAttachments(workspaceSlug, request.id));
          });
          set(this.workItemRequestIdsMap, [workItemId], uniq(_requestIds));
          this.rootStore.issue.issues.updateIssue(workItemId, {
            customer_request_ids: _requestIds,
          });
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
      // add work items to the issue store
      this.rootStore.issue.issues.addIssue(_workItems);
      runInAction(() => {
        // update request data if work item is added to the request
        if (requestId) {
          update(this.customerStore.requestsMap, [requestId], (request: TCustomerRequest) => ({
            ...request,
            work_item_ids: uniq([...workItemIds, ...(request.work_item_ids || [])]),
          }));
        }
        // update counts and data for work items
        _workItems.forEach((item) => {
          const _workItem = this.rootStore.issue.issues.getIssueById(item.id);
          if (requestId) {
            if (!this.workItemRequestIdsMap[item.id]) set(this.workItemRequestIdsMap, [item.id], []);
            // add request id to the work item
            concat(requestId, this.workItemRequestIdsMap[item.id]);
            // update counts for work items
            this.rootStore.issue.issues.updateIssue(item.id, {
              customer_request_ids: uniq([...(_workItem?.customer_request_ids || []), requestId]),
            });
          }
          // update customer count for work items
          this.rootStore.issue.issues.updateIssue(item.id, {
            customer_ids: [...(_workItem?.customer_ids || []), customerId],
          });
          if (this.workItemCustomerIds[item.id]) {
            update(this.workItemCustomerIds, [item.id], (ids: string[]) => uniq([...ids, customerId]));
          } else set(this.workItemCustomerIds, [item.id], [customerId]);
        });
        if (this.customerStore.customerWorkItemIdsMap[customerId]) {
          update(this.customerStore.customerWorkItemIdsMap, [customerId], (ids: string[]) => [...workItemIds, ...ids]);
        } else set(this.customerStore.customerWorkItemIdsMap, [customerId], workItemIds);
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
      const _requestId = requestId;
      runInAction(async () => {
        if (_requestId) {
          const _workItemIds = this.customerStore.requestsMap[_requestId]?.work_item_ids;
          remove(_workItemIds, (id) => id === workItemId);
          update(this.customerStore.requestsMap, [_requestId], (request: TCustomerRequest) => ({
            ...request,
            issue_ids: _workItemIds,
          }));
          // update count for work item if request is removed
          const _workItem = this.rootStore.issue.issues.getIssueById(workItemId);
          const _workItemCustomerRequestIds = _workItem?.customer_request_ids || [];
          this.rootStore.issue.issues.updateIssue(workItemId, {
            customer_request_ids: _workItemCustomerRequestIds.filter((id) => id !== _requestId),
          });
          // remove request from the work item
          remove(this.workItemRequestIdsMap[workItemId], (id) => id === _requestId);
        } else {
          // check if requests are related to the work item and remove from all of them
          this.removeWorkItemFromRequests(workItemId);
        }
        // fetch updated work items
        await this.customerStore.fetchCustomerWorkItems(workspaceSlug, customerId);
      });
      remove(this.workItemCustomerIds[workItemId], (id) => id === customerId);
      // update customer count for work item
      const _workItem = this.rootStore.issue.issues.getIssueById(workItemId);
      const _workItemCustomerIds = _workItem?.customer_ids || [];
      this.rootStore.issue.issues.updateIssue(workItemId, {
        customer_ids: _workItemCustomerIds.filter((id) => id !== customerId),
      });
    } catch (error) {
      console.error("CustomerStore->removeWorkItemFromCustomer", error);
      throw error;
    }
  };

  /**
   * @description Update requests
   */
  removeWorkItemFromRequests = (workItemId: string) => {
    // remove work item from all requests
    Object.values(this.customerStore.requestsMap).forEach((request) => {
      if (request.work_item_ids) {
        remove(request.work_item_ids, (id) => id === workItemId);
      }
    });
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
   * @description Get work item customer ids
   * @param workItemId
   */
  getWorkItemCustomerIds = computedFn((workItemId: string): string[] => {
    const customerIds = this.workItemCustomerIds[workItemId] ?? [];
    return uniq(customerIds);
  });

  /**
   * @description Get customer count by work item id
   * @param workItemId
   * @returns
   */
  getCustomerCountByWorkItemId = computedFn((workItemId: string): number => {
    const _customerIds = this.workItemCustomerIds[workItemId];
    if (_customerIds) {
      return _customerIds.length;
    } else {
      const _workItem = this.rootStore.issue.issues.getIssueById(workItemId);
      return _workItem?.customer_ids?.length ?? 0;
    }
  });
}
