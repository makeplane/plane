import set from "lodash/set";
import { action, makeObservable, runInAction } from "mobx";
// types
import { TBulkOperationsPayload } from "@plane/types";
// services
import { IssueService } from "@/services/issue";
import { IIssueRootStore } from "./root.store";

export type IIssueBulkOperationsStore = {
  // actions
  bulkUpdateProperties: (workspaceSlug: string, projectId: string, data: TBulkOperationsPayload) => void;
};

export class IssueBulkOperationsStore implements IIssueBulkOperationsStore {
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  issueService;

  constructor(_rootStore: IIssueRootStore) {
    makeObservable(this, {
      // actions
      bulkUpdateProperties: action,
    });

    this.rootIssueStore = _rootStore;
    this.issueService = new IssueService();
  }

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
