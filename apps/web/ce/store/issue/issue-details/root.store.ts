import { makeObservable } from "mobx";
import type { TIssueServiceType } from "@plane/types";
import type { IIssueDetail as IIssueDetailCore } from "@/store/issue/issue-details/root.store";
import { IssueDetail as IssueDetailCore } from "@/store/issue/issue-details/root.store";
import type { IIssueRootStore } from "@/store/issue/root.store";

export type IIssueDetail = IIssueDetailCore;

export class IssueDetail extends IssueDetailCore {
  constructor(rootStore: IIssueRootStore, serviceType: TIssueServiceType) {
    super(rootStore, serviceType);
    makeObservable(this, {
      // observables
    });
  }
}
