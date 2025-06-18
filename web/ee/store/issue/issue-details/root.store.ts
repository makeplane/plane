import { action, makeObservable } from "mobx";
import { TIssue, TIssueServiceType } from "@plane/types";
import { IssueService } from "@/plane-web/services/issue/issue.service";
import {
  IssueDetail as IssueDetailCore,
  IIssueDetail as IIssueDetailCore,
} from "@/store/issue/issue-details/root.store";
import { IIssueRootStore } from "@/store/issue/root.store";
import { WorkItemPagesStore } from "./page.store";

export interface IIssueDetail extends IIssueDetailCore {
  // stores
  duplicateWorkItem: (
    workspaceSlug: string,
    workItemId: string,
    targetProjectId: string
  ) => Promise<TIssue | undefined>;
  // stores
  pages: WorkItemPagesStore;
}

export class IssueDetail extends IssueDetailCore implements IIssueDetail {
  // services
  workItemService: IssueService;
  rootStore: IIssueRootStore;
  // store
  pages: WorkItemPagesStore;

  constructor(rootStore: IIssueRootStore, serviceType: TIssueServiceType) {
    super(rootStore, serviceType);
    makeObservable(this, {
      // observables
      duplicateWorkItem: action,
    });
    this.workItemService = new IssueService(serviceType);
    this.rootStore = rootStore;
    this.pages = new WorkItemPagesStore();
  }

  // actions
  /**
   * Duplicate a work item to a target project
   * @param workspaceSlug - The slug of the workspace
   * @param workItemId - The id of the work item / epic to duplicate
   * @param targetProjectId - The id of the target project
   * @returns The duplicated work item
   */
  duplicateWorkItem = async (workspaceSlug: string, workItemId: string, targetProjectId: string) => {
    const response = await this.workItemService.duplicateWorkItem(workspaceSlug, workItemId, targetProjectId);
    // Add work item to the target project
    this.rootStore.issues.addIssue([response]);
    return response;
  };
}
