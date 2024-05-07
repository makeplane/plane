import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { TBulkOperationsPayload } from "@plane/types";
// services
import { IssueService } from "@/services/issue";
import { IIssueRootStore } from "./root.store";

export type IIssueBulkOperationsStore = {
  // observables
  issueIds: string[];
  // computed
  isSelectionActive: boolean;
  // helper functions
  getIsIssueSelected: (issueId: string) => boolean;
  // actions
  toggleIssueSelection: (issueId: string) => void;
  clearSelection: () => void;
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => void;
};

export class IssueBulkOperationsStore implements IIssueBulkOperationsStore {
  // observables
  issueIds: string[] = [];
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  issueService;

  constructor(_rootStore: IIssueRootStore) {
    makeObservable(this, {
      // observable
      issueIds: observable,
      // computed
      isSelectionActive: computed,
      // actions
      toggleIssueSelection: action,
      clearSelection: action,
      bulkUpdateProperties: action,
    });

    this.rootIssueStore = _rootStore;
    this.issueService = new IssueService();
  }

  get isSelectionActive() {
    return this.issueIds.length > 0;
  }

  /**
   * @description check if an issue is selected
   * @param {string} issueId
   * @returns {boolean}
   */
  getIsIssueSelected = (issueId: string): boolean => this.issueIds.includes(issueId);

  /**
   * @description select an issue by issue id
   * @param {string} issueId
   */
  toggleIssueSelection = (issueId: string) => {
    const index = this.issueIds.indexOf(issueId);
    if (index === -1) this.issueIds.push(issueId);
    else this.issueIds.splice(index, 1);
  };

  /**
   * @description clear all selected issues
   */
  clearSelection = () => {
    this.issueIds = [];
  };

  /**
   * @description bulk update properties of selected issues
   * @param {TBulkOperationsPayload} data
   */
  bulkUpdateProperties = async (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => {
    const issueIds = data.issue_ids;
    // keep original data to rollback in case of error
    const originalData: Record<string, any> = {};
    try {
      runInAction(() => {
        issueIds.forEach((issueId) => {
          const issueDetails = this.rootIssueStore.issues.getIssueById(issueId);
          if (!issueDetails) throw new Error("Issue not found");
          Object.keys(data.properties).forEach((key) => {
            const property = key as keyof TBulkOperationsPayload["properties"];
            // update backup data
            set(originalData, [issueId, property], issueDetails[property]);
            // update root issue map properties
            this.rootIssueStore.issues.updateIssue(issueId, {
              [property]: data.properties[property],
            });
          });
        });
      });
      // make request to update issue properties
      await this.issueService.bulkOperations(workspaceSlug, projectId, data);
    } catch (error) {
      // rollback changes
      runInAction(() => {
        issueIds.forEach((issueId) => {
          Object.keys(data.properties).forEach((key) => {
            const property = key as keyof TBulkOperationsPayload["properties"];
            // revert root issue map properties
            this.rootIssueStore.issues.updateIssue(issueId, {
              [property]: originalData[issueId][property],
            });
          });
        });
      });
      throw error;
    }
  };
}
