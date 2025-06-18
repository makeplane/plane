import { makeObservable } from "mobx";
import { TIssueServiceType } from "@plane/types";
import { IssueDetail as IssueDetailCE } from "@/ce/store/issue/issue-details/root.store";
import { IIssueDetail as IIssueDetailCore } from "@/store/issue/issue-details/root.store";
import { IIssueRootStore } from "@/store/issue/root.store";
import { WorkItemPagesStore } from "./page.store";

export interface IIssueDetail extends IIssueDetailCore {
  // stores
  pages: WorkItemPagesStore;
}

export class IssueDetail extends IssueDetailCE implements IIssueDetail {
  // stores
  pages;
  constructor(rootStore: IIssueRootStore, serviceType: TIssueServiceType) {
    super(rootStore, serviceType);
    makeObservable(this, {
      // observables
    });
    this.pages = new WorkItemPagesStore();
  }
}
